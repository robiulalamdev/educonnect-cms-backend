import { z } from "zod";
import { CHAT_TYPES } from "./chat.types.js";

export const createDirectChatSchema = z.object({
  recipient_id: z.string(),
  initial_message: z.string().optional(),
  context_service_id: z.string().optional(),
});

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(5000),
  media_ids: z.array(z.string()).optional(),
  reply_to_id: z.string().optional(),
  context_service_id: z.string().optional(),
});

export const chatQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const messageQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

export type CreateDirectChatInput = z.infer<typeof createDirectChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ChatQueryInput = z.infer<typeof chatQuerySchema>;
export type MessageQueryInput = z.infer<typeof messageQuerySchema>;
