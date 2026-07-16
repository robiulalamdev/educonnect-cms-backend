import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import {
  updateTeacherProfileController,
  getTeacherDetailsController,
  getMyTeacherProfileController,
  listTeachersController,
} from "./teacher.controller.js";

const ALL_USERS = [USER_TYPES.ROLE_OBJECT.TEACHER, USER_TYPES.ROLE_OBJECT.STUDENT, USER_TYPES.ROLE_OBJECT.GUARDIAN];

export async function teacherRoutes(fastify: FastifyInstance) {
  // Get own teacher profile
  fastify.get(
    "/profile",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    getMyTeacherProfileController,
  );

  // Update own teacher profile
  fastify.patch(
    "/profile",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    updateTeacherProfileController,
  );

  // List approved teachers
  fastify.get(
    "/",
    { preHandler: [authenticate, requireRole(...ALL_USERS)] },
    listTeachersController,
  );

  // Get teacher details by ID
  fastify.get(
    "/:id",
    { preHandler: [authenticate, requireRole(...ALL_USERS)] },
    getTeacherDetailsController,
  );
}
