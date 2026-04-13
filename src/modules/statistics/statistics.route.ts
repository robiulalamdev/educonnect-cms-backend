import { FastifyInstance } from "fastify";
import { 
  getAdminStatsController, 
  getTeacherStatsController, 
  getStudentStatsController, 
  getGuardianStatsController 
} from "./statistics.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";

export async function statisticsRoutes(fastify: FastifyInstance) {
  // ── Dashboard / Admin ──────────────────────────────────────
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook("preHandler", authenticate);
    adminRoutes.addHook("preHandler", requireRole("SUPER_ADMIN", "ADMIN", "MODERATOR"));

    adminRoutes.get("/", getAdminStatsController);
  }, { prefix: "/dashboard" });

  // ── Profile / Own Data ─────────────────────────────────────
  fastify.register(async (profileRoutes) => {
    profileRoutes.addHook("preHandler", authenticate);

    profileRoutes.get("/teacher", { preHandler: [requireRole("TEACHER")] }, getTeacherStatsController);
    profileRoutes.get("/student", { preHandler: [requireRole("STUDENT")] }, getStudentStatsController);
    profileRoutes.get("/guardian", { preHandler: [requireRole("GUARDIAN")] }, getGuardianStatsController);
  }, { prefix: "/profile" });
}
