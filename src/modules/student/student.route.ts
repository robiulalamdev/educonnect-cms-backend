import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import { ADMIN_TYPES } from "../admin/admin.types.js";
import {
  updateStudentProfileController,
  getMyStudentProfileController,
  getStudentDetailsController,
} from "./student.controller.js";

export async function studentRoutes(fastify: FastifyInstance) {
  // Get own student profile
  fastify.get(
    "/profile",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.STUDENT)] },
    getMyStudentProfileController,
  );

  // Update own student profile
  fastify.patch(
    "/profile",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.STUDENT)] },
    updateStudentProfileController,
  );

  // Get student details by ID
  fastify.get(
    "/:id",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER, ...ADMIN_TYPES.PERMISSIONS.CAN_VIEW)] },
    getStudentDetailsController,
  );
}
