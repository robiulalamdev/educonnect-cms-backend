import { prisma } from "../../config/prisma.js";
import { CreateDirectChatInput, SendMessageInput, ChatQueryInput, MessageQueryInput } from "./chat.schema.js";
import { CHAT_TYPES } from "./chat.types.js";
import { socketManager } from "../../config/socket.js";
import { uploadToCloudinary, type UploadInput } from "../../utils/cloudinary-upload.js";

const safeMessageSelect = {
  id: true,
  body: true,
  sender_id: true,
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
  context_service_id: true,
  mentions: {
    select: {
      mentioned_user: {
        select: { id: true, username: true, full_name: true }
      }
    }
  }
} as const;

// Extract @username tokens from a message body for mention support
function extractMentions(body: string): string[] {
  const matches = body.match(/@([\w.]+)/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

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
          select: {
            is_admin: true,
            is_muted: true,
            user: {
              select: {
                id: true,
                full_name: true,
                username: true,
                avatar: { select: { key: true } }
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: { created_at: "desc" },
          select: {
            body: true,
            created_at: true,
            sender_id: true,
            sender: { select: { full_name: true } },
            media: { take: 1, select: { mime_type: true, filename: true } },
          }
        },
        // unread_count is maintained incrementally in chat_read_trackings —
        // no per-chat COUNT query needed
        read_trackings: {
          where: { user_id: userId },
          select: { unread_count: true }
        }
      }
    }),
    prisma.chat.count({
      where: { participants: { some: { user_id: userId } } }
    })
  ]);

  const data = chats.map((chat) => ({
    ...chat,
    unread_count: chat.read_trackings[0]?.unread_count ?? 0,
  }));

  return {
    data,
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

  // Sender-facing read state, derived from the other participants' tracking:
  //   READ      -> every other participant has last_read_at >= message.created_at
  //   DELIVERED -> at least one other participant has read it
  //   SENT      -> nobody has read it yet
  const participants = await prisma.chatParticipant.findMany({
    where: { chat_id: chatId },
    select: { user_id: true }
  });
  const otherIds = participants
    .map((p) => p.user_id)
    .filter((id) => id !== userId);
  const lastReadMap: Record<string, number> = {};
  if (otherIds.length > 0) {
    const trackings = await prisma.chatReadTracking.findMany({
      where: { chat_id: chatId, user_id: { in: otherIds } },
      select: { user_id: true, last_read_at: true }
    });
    for (const t of trackings) lastReadMap[t.user_id] = t.last_read_at.getTime();
  }

  const statusFor = (createdAt: Date) => {
    if (otherIds.length === 0) return "SENT";
    const readCount = otherIds.filter(
      (id) => (lastReadMap[id] ?? 0) >= createdAt.getTime()
    ).length;
    if (readCount === 0) return "SENT";
    return readCount >= otherIds.length ? "READ" : "DELIVERED";
  };

  return {
    data: messages.reverse().map((m) => ({
      ...m,
      status: statusFor(m.created_at),
    })),
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

  // Enforce max 3 attachments (matches docs + multipart config)
  const totalMedia = (media_ids?.length ?? 0) + (mediaUploads?.length ?? 0);
  if (totalMedia > 3) throw new Error("TOO_MANY_MEDIA");

  // Resolve @mentions against the chat's participants so we can notify them
  const usernames = extractMentions(data.body ?? "");
  const mentionedUsers = usernames.length > 0
    ? await prisma.user.findMany({
        where: {
          username: { in: usernames, mode: "insensitive" },
          chat_participants: { some: { chat_id: chatId } },
        },
        select: { id: true, username: true, full_name: true },
      })
    : [];

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
      select: { id: true }
    });

    // Store mention links (one row per mentioned user) inside the transaction
    if (mentionedUsers.length > 0) {
      await tx.messageMention.createMany({
        data: mentionedUsers.map((u) => ({
          message_id: msg.id,
          mentioned_user_id: u.id,
        })),
      });
    }

    // Update chat for sorting
    await tx.chat.update({
      where: { id: chatId },
      data: { updated_at: new Date() }
    });

    // Maintain unread counters for every OTHER participant (group-safe):
    // one row per user per chat, incremented here and reset on markChatRead.
    const otherIds = (chat?.participants ?? [])
      .filter((p) => p.user_id !== senderId)
      .map((p) => p.user_id);
    for (const id of otherIds) {
      await tx.chatReadTracking.upsert({
        where: { chat_id_user_id: { chat_id: chatId, user_id: id } },
        update: { unread_count: { increment: 1 } },
        create: { chat_id: chatId, user_id: id, unread_count: 1 },
      });
    }

    return msg;
  });

  // Upload new files and attach to the message (outside the DB transaction)
  if (mediaUploads && mediaUploads.length > 0) {
    const uploadedIds = await uploadMessageMedia(mediaUploads, senderId, message.id);
    if (uploadedIds.length > 0) {
      await prisma.message.update({
        where: { id: message.id },
        data: { media: { connect: uploadedIds.map(id => ({ id })) } },
      });
    }
  }

  const fullMessage = await prisma.message.findUnique({
    where: { id: message.id },
    select: safeMessageSelect
  });

  // A brand-new message hasn't been read by anyone yet.
  const payload = { ...fullMessage, status: "SENT" };

  // Real-time broadcast
  socketManager.emitToRoom(`chat_${chatId}`, "new_message", payload);

  // Notify mentioned users (via their personal room) so they can highlight it
  for (const u of mentionedUsers) {
    if (u.id === senderId) continue;
    socketManager.emitToUser(u.id, "mention_notification", {
      chatId,
      messageId: message.id,
      mentioned_by: senderId,
      mentioned_by_name: fullMessage?.sender?.full_name ?? "Someone",
      body: data.body ?? "",
    });
  }

  return payload;
}

// Upload message attachments to Cloudinary and persist Media rows (max 3 total)
async function uploadMessageMedia(
  uploads: UploadInput[],
  senderId: string,
  messageId: string,
): Promise<string[]> {
  const mediaIds: string[] = [];

  for (const upload of uploads) {
    const result = await uploadToCloudinary(upload);

    const media = await prisma.media.create({
      data: {
        key: result.public_id,
        filename: result.filename,
        mime_type: result.mimetype,
        size: result.size,
        type: result.mimetype.startsWith("image/")
          ? "IMAGE"
          : result.mimetype.startsWith("video/")
            ? "VIDEO"
            : "DOCUMENT",
        width: result.width ?? null,
        height: result.height ?? null,
        owner_type: "MESSAGE",
        message_id: messageId,
        uploaded_by_id: senderId,
      },
    });

    mediaIds.push(media.id);
  }

  return mediaIds;
}

export async function markChatRead(chatId: string, userId: string) {
  const existing = await prisma.chatReadTracking.findUnique({
    where: { chat_id_user_id: { chat_id: chatId, user_id: userId } },
    select: { unread_count: true },
  });
  const wasUnread = (existing?.unread_count ?? 0) > 0;

  // Advance the read cursor and reset the counter (one row per user per chat)
  await prisma.chatReadTracking.upsert({
    where: { chat_id_user_id: { chat_id: chatId, user_id: userId } },
    update: { last_read_at: new Date(), unread_count: 0 },
    create: { chat_id: chatId, user_id: userId, last_read_at: new Date(), unread_count: 0 },
  });

  // Notify the chat so senders can flip their ticks to the "seen" state
  if (wasUnread) {
    socketManager.emitToRoom(`chat_${chatId}`, "message_read", {
      chat_id: chatId,
      reader_id: userId,
    });
  }
}
