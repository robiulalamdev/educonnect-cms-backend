import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import {
  createAnnouncementController,
  getAnnouncementByIdController,
  getAnnouncementListController,
  updateAnnouncementController,
  deleteAnnouncementController,
} from "./announcement.controller.js";

const ALL_USERS = [USER_TYPES.ROLE_OBJECT.TEACHER, USER_TYPES.ROLE_OBJECT.STUDENT, USER_TYPES.ROLE_OBJECT.GUARDIAN];

export async function announcementRoutes(fastify: FastifyInstance) {
  // Teacher: create announcement for a batch
  fastify.post(
    "/batch/:batchId",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    createAnnouncementController,
  );

  // List announcements (authenticated: teacher/admin)
  fastify.get(
    "/",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    getAnnouncementListController,
  );

  // Get single announcement
  fastify.get(
    "/:id",
    { preHandler: [authenticate, requireRole(...ALL_USERS)] },
    getAnnouncementByIdController,
  );

  // Teacher: update
  fastify.patch(
    "/:id",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    updateAnnouncementController,
  );

  // Teacher: delete
  fastify.delete(
    "/:id",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    deleteAnnouncementController,
  );
}
