import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import { ADMIN_TYPES } from "../admin/admin.types.js";
import {
  getAdminStatsController,
  getTeacherStatsController,
  getStudentStatsController,
  getGuardianStatsController,
} from "./statistics.controller.js";

export async function statisticsRoutes(fastify: FastifyInstance) {
  // Admin stats
  fastify.get(
    "/dashboard/",
    { preHandler: [authenticate, requireRole(...ADMIN_TYPES.PERMISSIONS.CAN_VIEW)] },
    getAdminStatsController,
  );

  // Profile stats
  fastify.register(async (profileRoutes) => {
    profileRoutes.addHook("preHandler", authenticate);
    profileRoutes.get("/teacher", { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] }, getTeacherStatsController);
    profileRoutes.get("/student", { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.STUDENT)] }, getStudentStatsController);
    profileRoutes.get("/guardian", { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.GUARDIAN)] }, getGuardianStatsController);
  }, { prefix: "/profile" });
}
