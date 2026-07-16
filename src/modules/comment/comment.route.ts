import { FastifyInstance } from "fastify";
import {
  createCommentController,
  getCommentsController,
  updateCommentController,
  deleteCommentController,
  getRepliesController,
} from "./comment.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

export async function commentRoutes(fastify: FastifyInstance) {
  // Post comments
  fastify.post("/:postId/comments", { preHandler: [authenticate] }, createCommentController);
  fastify.get("/:postId/comments", getCommentsController);

  // Comment CRUD
  fastify.patch("/:commentId", { preHandler: [authenticate] }, updateCommentController);
  fastify.delete("/:commentId", { preHandler: [authenticate] }, deleteCommentController);

  // Replies
  fastify.get("/:commentId/replies", getRepliesController);
}
