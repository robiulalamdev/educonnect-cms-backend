import { FastifyInstance } from "fastify";
import { 
  getOrCreateDirectChatController, 
  getChatListController, 
  getMessagesController, 
  sendMessageController, 
  markChatReadController, 
  getAdminChatListController 
} from "./chat.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";

export async function chatRoutes(fastify: FastifyInstance) {
  // ── Profile / Own Data ─────────────────────────────────────
  fastify.register(async (profileRoutes) => {
    profileRoutes.addHook("preHandler", authenticate);
    
    // All roles can use these as they are participant-checked in service
    profileRoutes.get("/", getChatListController);
    profileRoutes.post("/direct", getOrCreateDirectChatController);
    profileRoutes.get("/:id/messages", getMessagesController);
    profileRoutes.post("/:id/messages", sendMessageController);
    profileRoutes.patch("/:id/read", markChatReadController);
  }, { prefix: "/profile" });

  // ── Dashboard / Admin ──────────────────────────────────────
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook("preHandler", authenticate);
    adminRoutes.addHook("preHandler", requireRole("SUPER_ADMIN", "ADMIN", "MODERATOR"));

    adminRoutes.get("/", getAdminChatListController);
  }, { prefix: "/dashboard" });
}
