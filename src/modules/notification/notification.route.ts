import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import { notificationService } from "../shared/notification.service.js";
import {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController,
} from "./notification.controller.js";

const ALL_USERS = [USER_TYPES.ROLE_OBJECT.TEACHER, USER_TYPES.ROLE_OBJECT.STUDENT, USER_TYPES.ROLE_OBJECT.GUARDIAN];

export async function notificationRoutes(fastify: FastifyInstance) {
  // GET /api/v1/notifications/firebase-config (PUBLIC - no auth)
  fastify.get("/firebase-config", async (_req, reply) => {
    return reply.send({ success: true, data: notificationService.getPublicConfig() });
  });

  fastify.register(async (routes) => {
    routes.addHook("preHandler", authenticate);
    routes.addHook("preHandler", requireRole(...ALL_USERS));

    routes.get("/", getNotificationsController);
    routes.patch("/:id/read", markAsReadController);
    routes.patch("/read-all", markAllAsReadController);
    routes.delete("/:id", deleteNotificationController);
  });
}
