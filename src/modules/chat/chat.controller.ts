import { FastifyRequest, FastifyReply } from "fastify";
import {
  createDirectChatSchema,
  sendMessageSchema,
  chatQuerySchema,
  messageQuerySchema,
} from "./chat.schema.js";
import {
  getOrCreateDirectChat,
  getChatList,
  getMessages,
  sendMessage,
  markChatRead,
} from "./chat.service.js";
import { parseMultipart, MultipartValidationError } from "../../utils/parse-multipart.js";
import { CLD_FOLDERS } from "../../config/cloudinary.js";

export async function getOrCreateDirectChatController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;

  let fields: Record<string, any>;
  let mediaFiles: import("../../utils/parse-multipart.js").ParsedFile[] = [];

  try {
    const parsed = await parseMultipart(req, {
      allowedFileFields: {
        media: { folder: CLD_FOLDERS.MESSAGE_MEDIA, maxCount: 3, required: false },
      },
    });
    fields = parsed.fields;
    mediaFiles = parsed.files["media"] ?? [];
  } catch (err) {
    if (err instanceof MultipartValidationError) {
      return reply.status(400).send({ success: false, message: err.message, field: err.field });
    }
    throw err;
  }

  const input = createDirectChatSchema.parse(fields);
  const mediaUploads = mediaFiles.map((f) => ({
    buffer: f.buffer,
    mimetype: f.mimetype,
    originalFilename: f.filename,
    folder: CLD_FOLDERS.MESSAGE_MEDIA,
    size: f.size,
  }));

  try {
    const chat = await getOrCreateDirectChat(userId, input.recipient_id);

    if (input.initial_message) {
      await sendMessage(chat.id, userId, {
        body: input.initial_message,
        context_service_id: input.context_service_id,
      }, mediaUploads);
    }

    return reply.send({ success: true, data: chat });
  } catch (err: any) {
    if (err.message === "USER_BLOCKED") {
      return reply.status(403).send({ success: false, message: "Cannot create chat with this user" });
    }
    throw err;
  }
}

export async function getChatListController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const query = chatQuerySchema.parse(req.query);
  const data = await getChatList(userId, query);
  return reply.send({ success: true, ...data });
}

export async function getMessagesController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const { id: chatId } = req.params as { id: string };
  const query = messageQuerySchema.parse(req.query);
  const data = await getMessages(chatId, userId, query);
  return reply.send({ success: true, ...data });
}

export async function sendMessageController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const { id: chatId } = req.params as { id: string };

  let fields: Record<string, any>;
  let mediaFiles: import("../../utils/parse-multipart.js").ParsedFile[] = [];

  try {
    const parsed = await parseMultipart(req, {
      allowedFileFields: {
        media: { folder: CLD_FOLDERS.MESSAGE_MEDIA, maxCount: 3, required: false },
      },
    });
    fields = parsed.fields;
    mediaFiles = parsed.files["media"] ?? [];
  } catch (err) {
    if (err instanceof MultipartValidationError) {
      return reply.status(400).send({ success: false, message: err.message, field: err.field });
    }
    throw err;
  }

  const input = sendMessageSchema.parse(fields);
  const mediaUploads = mediaFiles.map((f) => ({
    buffer: f.buffer,
    mimetype: f.mimetype,
    originalFilename: f.filename,
    folder: CLD_FOLDERS.MESSAGE_MEDIA,
    size: f.size,
  }));

  try {
    const data = await sendMessage(chatId, userId, input, mediaUploads);
    return reply.send({ success: true, data });
  } catch (err: any) {
    if (err.message === "USER_BLOCKED") {
      return reply.status(403).send({ success: false, message: "Cannot send message to this user" });
    }
    if (err.message === "TOO_MANY_MEDIA") {
      return reply.status(400).send({ success: false, message: "A message can have up to 3 attachments" });
    }
    throw err;
  }
}

export async function markChatReadController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const { id: chatId } = req.params as { id: string };
  await markChatRead(chatId, userId);
  return reply.send({ success: true, message: "Chat marked as read" });
}

export async function getAdminChatListController(req: FastifyRequest, reply: FastifyReply) {
  const query = chatQuerySchema.parse(req.query);
  return reply.send({ success: true, data: [], meta: { total: 0, page: query.page, limit: query.limit, total_pages: 0 } });
}
