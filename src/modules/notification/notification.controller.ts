import { FastifyRequest, FastifyReply } from "fastify";
import { notificationQuerySchema } from "./notification.schema.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "./notification.service.js";

export async function getNotificationsController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const query = notificationQuerySchema.parse(req.query);
  const data = await getNotifications(userId, query);
  return reply.send({ success: true, ...data });
}

export async function markAsReadController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };
  await markAsRead(id, userId);
  return reply.send({ success: true, message: "Notification marked as read" });
}

export async function markAllAsReadController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const result = await markAllAsRead(userId);
  return reply.send({ success: true, message: "All notifications marked as read", data: result });
}

export async function deleteNotificationController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };
  await deleteNotification(id, userId);
  return reply.send({ success: true, message: "Notification deleted" });
}
