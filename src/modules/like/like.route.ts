import { FastifyInstance } from "fastify";
import {
  togglePostLikeController,
  toggleCommentLikeController,
  getPostLikesController,
} from "./like.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

export async function likeRoutes(fastify: FastifyInstance) {
  fastify.post("/:postId/like", { preHandler: [authenticate] }, async (req, reply) => {
    if (!req.user) return reply.status(401).send({ success: false, message: "Not authenticated" });
    return togglePostLikeController(req, reply);
  });
  fastify.get("/:postId/like", getPostLikesController);
  fastify.post("/comments/:commentId/like", { preHandler: [authenticate] }, async (req, reply) => {
    if (!req.user) return reply.status(401).send({ success: false, message: "Not authenticated" });
    return toggleCommentLikeController(req, reply);
  });
  fastify.get("/comments/:commentId/like", getPostLikesController);
}
