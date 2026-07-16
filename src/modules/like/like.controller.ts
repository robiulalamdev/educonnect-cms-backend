import { FastifyRequest, FastifyReply } from "fastify";
import {
  togglePostLike,
  toggleCommentLike,
  getPostLikeCount,
  getCommentLikeCount,
  hasUserLikedPost,
  hasUserLikedComment,
} from "./like.service.js";
import { socketManager } from "../../config/socket.js";

export async function togglePostLikeController(req: FastifyRequest, reply: FastifyReply) {
  const { postId } = req.params as { postId: string };
  const userId = req.user!.userId;

  const result = await togglePostLike(postId, userId);
  const count = await getPostLikeCount(postId);

  // Emit real-time event
  socketManager.emitToRoom(`post_${postId}`, "post_liked", {
    postId,
    liked: result.liked,
    likeCount: count,
    userId,
  });

  return reply.send({ success: true, data: { liked: result.liked, likeCount: count } });
}

export async function toggleCommentLikeController(req: FastifyRequest, reply: FastifyReply) {
  const { commentId } = req.params as { commentId: string };
  const userId = req.user!.userId;

  const result = await toggleCommentLike(commentId, userId);
  const count = await getCommentLikeCount(commentId);

  return reply.send({ success: true, data: { liked: result.liked, likeCount: count } });
}

export async function getPostLikesController(req: FastifyRequest, reply: FastifyReply) {
  const { postId } = req.params as { postId: string };
  const userId = req.user?.userId;

  const [count, liked] = await Promise.all([
    getPostLikeCount(postId),
    userId ? hasUserLikedPost(postId, userId) : false,
  ]);

  return reply.send({ success: true, data: { likeCount: count, liked } });
}
