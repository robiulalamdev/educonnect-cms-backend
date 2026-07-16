import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import { ADMIN_TYPES } from "../admin/admin.types.js";
import {
  markAttendanceController,
  bulkMarkAttendanceController,
  getAttendanceListController,
  getStudentAttendanceSummaryController,
} from "./attendance.controller.js";

export async function attendanceRoutes(fastify: FastifyInstance) {
  // Teacher: mark attendance
  fastify.post(
    "/batch/:batchId",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    markAttendanceController,
  );

  fastify.post(
    "/batch/:batchId/bulk",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    bulkMarkAttendanceController,
  );

  // Teacher/Admin: list attendance
  fastify.get(
    "/",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER, ...ADMIN_TYPES.PERMISSIONS.CAN_VIEW)] },
    getAttendanceListController,
  );

  // Teacher/Student/Guardian: view attendance summary
  fastify.get(
    "/batch/:batchId/student/:studentProfileId/summary",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER, USER_TYPES.ROLE_OBJECT.STUDENT, USER_TYPES.ROLE_OBJECT.GUARDIAN)] },
    getStudentAttendanceSummaryController,
  );
}
