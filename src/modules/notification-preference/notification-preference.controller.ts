import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { getPreferences, updatePreferences } from "./notification-preference.service.js";

const updatePreferencesSchema = z.object({
  in_app_enabled: z.boolean().optional(),
  email_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  enrollment_notifications: z.boolean().optional(),
  payment_notifications: z.boolean().optional(),
  announcement_notifications: z.boolean().optional(),
  task_notifications: z.boolean().optional(),
  attendance_notifications: z.boolean().optional(),
  message_notifications: z.boolean().optional(),
  social_notifications: z.boolean().optional(),
});

export async function getPreferencesController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const data = await getPreferences(userId);
  return reply.send({ success: true, data });
}

export async function updatePreferencesController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const input = updatePreferencesSchema.parse(req.body);
  const data = await updatePreferences(userId, input);
  return reply.send({ success: true, message: "Preferences updated", data });
}
