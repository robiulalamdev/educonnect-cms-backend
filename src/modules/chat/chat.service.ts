import { prisma } from "../../config/prisma.js";
import { CreateDirectChatInput, SendMessageInput, ChatQueryInput, MessageQueryInput } from "./chat.schema.js";
import { CHAT_TYPES } from "./chat.types.js";
import { socketManager } from "../../config/socket.js";
import { uploadToCloudinary, type UploadInput } from "../../utils/cloudinary-upload.js";

const safeMessageSelect = {
  id: true,
  body: true,
  sender_id: true,
  status: true,
  created_at: true,
  sender: {
    select: {
      id: true,
      full_name: true,
      avatar: { select: { key: true } }
    }
  },
  media: {
    select: { id: true, key: true, filename: true, mime_type: true, type: true }
  },
  reply_to: {
    select: { id: true, body: true, sender_id: true }
  },
  context_service_id: true
} as const;

export async function getOrCreateDirectChat(userId: string, targetUserId: string) {
  // 0. Check if either user has blocked the other
  const blockExists = await prisma.block.findFirst({
    where: {
      OR: [
        { blocker_id: userId, blocked_id: targetUserId },
        { blocker_id: targetUserId, blocked_id: userId },
      ],
    },
  });
  if (blockExists) throw new Error("USER_BLOCKED");

  // 1. Check if direct chat exists
  const existing = await prisma.chat.findFirst({
    where: {
      type: CHAT_TYPES.TYPE_OBJECT.DIRECT,
      participants: { every: { user_id: { in: [userId, targetUserId] } } }
    },
    include: { participants: true }
  });

  // extra check to ensure it's strictly between these two
  const confirmed = existing?.participants.length === 2 ? existing : null;

  if (confirmed) return confirmed;

  // 2. Create new direct chat
  return prisma.chat.create({
    data: {
      type: CHAT_TYPES.TYPE_OBJECT.DIRECT,
      participants: {
        create: [
          { user_id: userId },
          { user_id: targetUserId }
        ]
      }
    }
  });
}

export async function getChatList(userId: string, query: ChatQueryInput) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const [chats, total] = await Promise.all([
    prisma.chat.findMany({
      where: {
        participants: { some: { user_id: userId } }
      },
      skip,
      take: limit,
      orderBy: { updated_at: "desc" },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                avatar: { select: { key: true } }
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: { created_at: "desc" },
          select: { body: true, created_at: true }
        }
      }
    }),
    prisma.chat.count({
      where: { participants: { some: { user_id: userId } } }
    })
  ]);

  return {
    data: chats,
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  };
}

export async function getMessages(chatId: string, userId: string, query: MessageQueryInput) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  // Verify membership
  const member = await prisma.chatParticipant.findUnique({
    where: { chat_id_user_id: { chat_id: chatId, user_id: userId } }
  });
  if (!member) throw new Error("FORBIDDEN");

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { chat_id: chatId },
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: safeMessageSelect
    }),
    prisma.message.count({ where: { chat_id: chatId } })
  ]);

  return {
    data: messages.reverse(),
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  };
}

export async function sendMessage(chatId: string, senderId: string, input: SendMessageInput, mediaUploads?: UploadInput[]) {
  const { media_ids, ...data } = input;

  // Verify membership
  const member = await prisma.chatParticipant.findUnique({
    where: { chat_id_user_id: { chat_id: chatId, user_id: senderId } }
  });
  if (!member) throw new Error("FORBIDDEN");

  // Check if sender is blocked by any participant (for direct chats)
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { type: true, participants: { select: { user_id: true } } },
  });

  if (chat?.type === "DIRECT") {
    const otherUserId = chat.participants.find(p => p.user_id !== senderId)?.user_id;
    if (otherUserId) {
      const blockExists = await prisma.block.findFirst({
        where: {
          OR: [
            { blocker_id: senderId, blocked_id: otherUserId },
            { blocker_id: otherUserId, blocked_id: senderId },
          ],
        },
      });
      if (blockExists) throw new Error("USER_BLOCKED");
    }
  }

  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        ...data,
        chat_id: chatId,
        sender_id: senderId,
        media: {
          connect: media_ids?.map(id => ({ id })) || []
        }
      },
      select: safeMessageSelect
    });

    // Update chat for sorting
    await tx.chat.update({
      where: { id: chatId },
      data: { updated_at: new Date() }
    });

    return msg;
  });

  // Real-time broadcast
  socketManager.emitToRoom(`chat_${chatId}`, "new_message", message);

  return message;
}

export async function markChatRead(chatId: string, userId: string) {
  return prisma.chatParticipant.update({
    where: { chat_id_user_id: { chat_id: chatId, user_id: userId } },
    data: { last_read: new Date() }
  });
}
