import { prisma } from "../../config/prisma.js";
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
import { notifyUser } from "../notification/notification.service.js";

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

  // Create notification for post author (if not self-like)
  if (result.liked) {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { author_id: true, title: true } });
    if (post && post.author_id !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { full_name: true } });
      notifyUser({
        user_id: post.author_id,
        type: "POST_LIKED",
        title: "New like on your post",
        body: `${user?.full_name || "Someone"} liked your post${post.title ? ": " + post.title : ""}`,
        reference_type: "post",
        reference_id: postId,
        category: "social",
      });
      // Send real-time notification
      socketManager.emitToRoom(`user_${post.author_id}`, "new_notification", {
        type: "POST_LIKED",
        title: "New like on your post",
        body: `${user?.full_name || "Someone"} liked your post`,
      });
    }
  }

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
