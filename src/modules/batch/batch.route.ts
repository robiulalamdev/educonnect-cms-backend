import { FastifyInstance } from "fastify";
import {
  createBatchController,
  getBatchListController,
  getBatchByIdController,
  updateBatchController,
  getTeacherBatchesController,
  getAdminBatchesController,
  getBatchesDropdownController,
  getCalendarEventsController,
} from "./batch.controller.js";
import {
  createScheduleOverrideController,
  getScheduleOverridesController,
  updateScheduleOverrideController,
  deleteScheduleOverrideController,
} from "./schedule-override.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import { ADMIN_TYPES } from "../admin/admin.types.js";

export async function batchRoutes(fastify: FastifyInstance) {
  // ── Root / Public ──────────────────────────────────────────
  fastify.get("/", getBatchListController);
  fastify.get("/:id", getBatchByIdController);
  fastify.get("/dropdown/root", getBatchesDropdownController);

  // ── Profile / Own Data ─────────────────────────────────────
  fastify.register(async (profileRoutes) => {
    profileRoutes.addHook("preHandler", authenticate);
    profileRoutes.addHook("preHandler", requireRole(USER_TYPES.ROLE_OBJECT.TEACHER));

    profileRoutes.post("/teacher", createBatchController);
    profileRoutes.get("/teacher", getTeacherBatchesController);
    profileRoutes.patch("/teacher/:id", updateBatchController);
    profileRoutes.get("/teacher/dropdown", getBatchesDropdownController);

    // Schedule Overrides
    profileRoutes.post("/teacher/:batchId/schedule-overrides", createScheduleOverrideController);
    profileRoutes.get("/teacher/:batchId/schedule-overrides", getScheduleOverridesController);
  }, { prefix: "/profile" });

  // ── Calendar ─────────────────────────────────────────────
  fastify.get(
    "/calendar",
    { preHandler: [authenticate, requireRole(...ALL_USERS)] },
    getCalendarEventsController,
  );

  // Schedule Override management
  fastify.patch(
    "/schedule-overrides/:id",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    updateScheduleOverrideController,
  );
  fastify.delete(
    "/schedule-overrides/:id",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    deleteScheduleOverrideController,
  );

  // ── Dashboard / Admin ──────────────────────────────────────
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook("preHandler", authenticate);
    adminRoutes.addHook("preHandler", requireRole(...ADMIN_TYPES.PERMISSIONS.CAN_VIEW));

    adminRoutes.get("/", getAdminBatchesController);
    adminRoutes.get("/dropdown", getBatchesDropdownController);
  }, { prefix: "/dashboard" });
}
