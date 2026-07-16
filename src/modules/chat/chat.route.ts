import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import { ADMIN_TYPES } from "../admin/admin.types.js";
import {
  getOrCreateDirectChatController,
  getChatListController,
  getMessagesController,
  sendMessageController,
  markChatReadController,
  getAdminChatListController,
} from "./chat.controller.js";

const ALL_USERS = [USER_TYPES.ROLE_OBJECT.TEACHER, USER_TYPES.ROLE_OBJECT.STUDENT, USER_TYPES.ROLE_OBJECT.GUARDIAN];

export async function chatRoutes(fastify: FastifyInstance) {
  // ── Profile / Own Data ─────────────────────────────────────
  fastify.register(async (profileRoutes) => {
    profileRoutes.addHook("preHandler", authenticate);

    profileRoutes.get("/", { preHandler: [requireRole(...ALL_USERS)] }, getChatListController);
    profileRoutes.post("/direct", { preHandler: [requireRole(...ALL_USERS)] }, getOrCreateDirectChatController);
    profileRoutes.get("/:id/messages", { preHandler: [requireRole(...ALL_USERS)] }, getMessagesController);
    profileRoutes.post("/:id/messages", { preHandler: [requireRole(...ALL_USERS)] }, sendMessageController);
    profileRoutes.patch("/:id/read", { preHandler: [requireRole(...ALL_USERS)] }, markChatReadController);
  }, { prefix: "/profile" });

  // ── Dashboard / Admin ──────────────────────────────────────
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook("preHandler", authenticate);
    adminRoutes.addHook("preHandler", requireRole(...ADMIN_TYPES.PERMISSIONS.CAN_VIEW));

    adminRoutes.get("/", getAdminChatListController);
  }, { prefix: "/dashboard" });
}
