import { FastifyRequest, FastifyReply } from "fastify";
import { 
  createDirectChatSchema, 
  sendMessageSchema, 
  chatQuerySchema, 
  messageQuerySchema 
} from "./chat.schema.js";
import { 
  getOrCreateDirectChat, 
  getChatList, 
  getMessages, 
  sendMessage, 
  markChatRead 
} from "./chat.service.js";

export async function getOrCreateDirectChatController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const { recipient_id, initial_message, context_service_id } = createDirectChatSchema.parse(req.body);
  
  const chat = await getOrCreateDirectChat(userId, recipient_id);

  if (initial_message) {
    await sendMessage(chat.id, userId, { 
      body: initial_message, 
      context_service_id 
    });
  }

  return reply.send({ success: true, data: chat });
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
  const input = sendMessageSchema.parse(req.body);
  const data = await sendMessage(chatId, userId, input);
  return reply.send({ success: true, data });
}

export async function markChatReadController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const { id: chatId } = req.params as { id: string };
  await markChatRead(chatId, userId);
  return reply.send({ success: true, message: "Chat marked as read" });
}

// Admin Controller
export async function getAdminChatListController(req: FastifyRequest, reply: FastifyReply) {
  const query = chatQuerySchema.parse(req.query);
  // Implementation for global chat list (can be added to service)
  // For now, return empty or implement a global fetch
  return reply.send({ success: true, data: [], meta: { total: 0, page: query.page, limit: query.limit, total_pages: 0 } });
}
