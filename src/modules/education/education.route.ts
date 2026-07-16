import { FastifyInstance } from "fastify";
import {
  getLevelGroupsController,
  getLevelsController,
  getSubjectCategoriesController,
  getSubjectsController,
  getLevelsDropdownController,
  getSubjectsDropdownController,
} from "./education.controller.js";
import {
  createLevelGroupController,
  updateLevelGroupController,
  deleteLevelGroupController,
  createLevelController,
  updateLevelController,
  deleteLevelController,
  createSubjectCategoryController,
  updateSubjectCategoryController,
  deleteSubjectCategoryController,
  createSubjectController,
  updateSubjectController,
  deleteSubjectController,
} from "./education.admin.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { ADMIN_TYPES } from "../admin/admin.types.js";

export async function educationRoutes(fastify: FastifyInstance) {
  // ── Root / Public ──────────────────────────────────────────
  fastify.get("/groups", getLevelGroupsController);
  fastify.get("/levels", getLevelsController);
  fastify.get("/categories", getSubjectCategoriesController);
  fastify.get("/subjects", getSubjectsController);

  // Optimized Public Dropdowns
  fastify.get("/dropdown/levels", getLevelsDropdownController);
  fastify.get("/dropdown/subjects", getSubjectsDropdownController);

  // ── Dashboard / Admin CRUD ──────────────────────────────────
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook("preHandler", authenticate);
    adminRoutes.addHook("preHandler", requireRole(...ADMIN_TYPES.PERMISSIONS.CAN_MANAGE_EDUCATION));

    // Level Groups
    adminRoutes.post("/level-groups", createLevelGroupController);
    adminRoutes.patch("/level-groups/:id", updateLevelGroupController);
    adminRoutes.delete("/level-groups/:id", deleteLevelGroupController);

    // Levels
    adminRoutes.post("/levels", createLevelController);
    adminRoutes.patch("/levels/:id", updateLevelController);
    adminRoutes.delete("/levels/:id", deleteLevelController);

    // Subject Categories
    adminRoutes.post("/subject-categories", createSubjectCategoryController);
    adminRoutes.patch("/subject-categories/:id", updateSubjectCategoryController);
    adminRoutes.delete("/subject-categories/:id", deleteSubjectCategoryController);

    // Subjects
    adminRoutes.post("/subjects", createSubjectController);
    adminRoutes.patch("/subjects/:id", updateSubjectController);
    adminRoutes.delete("/subjects/:id", deleteSubjectController);

    // Dropdowns
    adminRoutes.get("/dropdown/levels", getLevelsDropdownController);
    adminRoutes.get("/dropdown/subjects", getSubjectsDropdownController);
  }, { prefix: "/dashboard" });
}
