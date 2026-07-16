import { FastifyInstance } from "fastify";
import {
  togglePostLikeController,
  toggleCommentLikeController,
  getPostLikesController,
} from "./like.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

export async function likeRoutes(fastify: FastifyInstance) {
  fastify.post("/posts/:postId/like", { preHandler: [authenticate] }, togglePostLikeController);
  fastify.get("/posts/:postId/like", getPostLikesController);
  fastify.post("/comments/:commentId/like", { preHandler: [authenticate] }, toggleCommentLikeController);
}
