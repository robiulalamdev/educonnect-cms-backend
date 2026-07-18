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
  try {
    const { postId } = req.params as { postId: string };
    const userId = req.user!.userId;

    const result = await togglePostLike(postId, userId);
    const count = await getPostLikeCount(postId);

    // Emit real-time event (non-blocking)
    try {
      socketManager.emitToRoom(`post_${postId}`, "post_liked", {
        postId,
        liked: result.liked,
        likeCount: count,
        userId,
      });
    } catch {}

    // Create notification for post author (if not self-like) — non-blocking
    if (result.liked) {
      prisma.post.findUnique({ where: { id: postId }, select: { author_id: true, title: true } })
        .then((post) => {
          if (post && post.author_id !== userId) {
            prisma.user.findUnique({ where: { id: userId }, select: { full_name: true } })
              .then((user) => {
                notifyUser({
                  user_id: post.author_id,
                  type: "POST_LIKED",
                  title: "New like on your post",
                  body: `${user?.full_name || "Someone"} liked your post${post.title ? ": " + post.title : ""}`,
                  reference_type: "post",
                  reference_id: postId,
                  category: "social",
                });
                try {
                  socketManager.emitToRoom(`user_${post.author_id}`, "new_notification", {
                    type: "POST_LIKED",
                    title: "New like on your post",
                    body: `${user?.full_name || "Someone"} liked your post`,
                  });
                } catch {}
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }

    return reply.send({ success: true, data: { liked: result.liked, likeCount: count } });
  } catch (err: any) {
    console.error("[Like] togglePostLike error:", err.message);
    return reply.status(500).send({ success: false, message: "Failed to toggle like" });
  }
}

export async function toggleCommentLikeController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { commentId } = req.params as { commentId: string };
    const userId = req.user!.userId;

    const result = await toggleCommentLike(commentId, userId);
    const count = await getCommentLikeCount(commentId);

    return reply.send({ success: true, data: { liked: result.liked, likeCount: count } });
  } catch (err: any) {
    console.error("[Like] toggleCommentLike error:", err.message);
    return reply.status(500).send({ success: false, message: "Failed to toggle like" });
  }
}

export async function getPostLikesController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { postId } = req.params as { postId: string };
    const userId = req.user?.userId;

    const [count, liked] = await Promise.all([
      getPostLikeCount(postId),
      userId ? hasUserLikedPost(postId, userId) : false,
    ]);

    return reply.send({ success: true, data: { likeCount: count, liked } });
  } catch (err: any) {
    console.error("[Like] getPostLikes error:", err.message);
    return reply.status(500).send({ success: false, message: "Failed to get likes" });
  }
}
