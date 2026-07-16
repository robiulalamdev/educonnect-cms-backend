import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import { ADMIN_TYPES } from "../admin/admin.types.js";
import {
  createReviewController,
  replyToReviewController,
  getReviewListController,
  hideReviewController,
} from "./review.controller.js";

const ALL_USERS = [USER_TYPES.ROLE_OBJECT.TEACHER, USER_TYPES.ROLE_OBJECT.STUDENT, USER_TYPES.ROLE_OBJECT.GUARDIAN];

export async function reviewRoutes(fastify: FastifyInstance) {
  // List reviews
  fastify.get(
    "/",
    { preHandler: [authenticate, requireRole(...ALL_USERS, ...ADMIN_TYPES.PERMISSIONS.CAN_VIEW)] },
    getReviewListController,
  );

  // Student: create review
  fastify.post(
    "/",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.STUDENT)] },
    createReviewController,
  );

  // Teacher: reply to review
  fastify.post(
    "/:id/reply",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    replyToReviewController,
  );

  // Admin: hide review
  fastify.patch(
    "/:id/hide",
    { preHandler: [authenticate, requireRole(...ADMIN_TYPES.PERMISSIONS.CAN_MODERATE_REVIEW)] },
    hideReviewController,
  );
}
