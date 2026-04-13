import { FastifyInstance } from "fastify";
import { 
  createBatchController, 
  getBatchListController, 
  getBatchByIdController, 
  updateBatchController, 
  getTeacherBatchesController, 
  getAdminBatchesController, 
  getBatchesDropdownController 
} from "./batch.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";

export async function batchRoutes(fastify: FastifyInstance) {
  // ── Root / Public ──────────────────────────────────────────
  fastify.get("/", getBatchListController);
  fastify.get("/:id", getBatchByIdController);
  fastify.get("/dropdown/root", getBatchesDropdownController);

  // ── Profile / Own Data ─────────────────────────────────────
  fastify.register(async (profileRoutes) => {
    profileRoutes.addHook("preHandler", authenticate);
    profileRoutes.addHook("preHandler", requireRole("TEACHER"));

    profileRoutes.post("/teacher", createBatchController);
    profileRoutes.get("/teacher", getTeacherBatchesController);
    profileRoutes.patch("/teacher/:id", updateBatchController);
    profileRoutes.get("/teacher/dropdown", getBatchesDropdownController);
  }, { prefix: "/profile" });

  // ── Dashboard / Admin ──────────────────────────────────────
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook("preHandler", authenticate);
    adminRoutes.addHook("preHandler", requireRole("SUPER_ADMIN", "ADMIN", "MODERATOR"));

    adminRoutes.get("/", getAdminBatchesController);
    adminRoutes.get("/dropdown", getBatchesDropdownController);
  }, { prefix: "/dashboard" });
}
