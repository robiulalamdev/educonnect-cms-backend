import { FastifyInstance } from "fastify";
import {
  getLevelGroupsController,
  getLevelsController,
  getSubjectCategoriesController,
  getSubjectsController,
  getLevelsDropdownController,
  getSubjectsDropdownController,
} from "./education.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";

export async function educationRoutes(fastify: FastifyInstance) {
  // ── Root / Public ──────────────────────────────────────────
  fastify.get("/groups", getLevelGroupsController);
  fastify.get("/levels", getLevelsController);
  fastify.get("/categories", getSubjectCategoriesController);
  fastify.get("/subjects", getSubjectsController);

  // Optimized Public Dropdowns
  fastify.get("/dropdown/levels", getLevelsDropdownController);
  fastify.get("/dropdown/subjects", getSubjectsDropdownController);

  // ── Dashboard / Admin ──────────────────────────────────────
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook("preHandler", authenticate);
    adminRoutes.addHook("preHandler", requireRole("SUPER_ADMIN", "ADMIN", "MANAGER"));

    // Management endpoints (can be added later if needed, e.g., create subjects)
    adminRoutes.get("/dropdown/levels", getLevelsDropdownController);
    adminRoutes.get("/dropdown/subjects", getSubjectsDropdownController);
  }, { prefix: "/dashboard" });
}
