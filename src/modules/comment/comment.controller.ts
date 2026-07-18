import { FastifyRequest, FastifyReply } from "fastify";
import { createCommentSchema, updateCommentSchema, commentQuerySchema } from "./comment.schema.js";
import { createComment, getCommentsByPost, updateComment, deleteComment, getReplies } from "./comment.service.js";
import { socketManager } from "../../config/socket.js";
import { notifyUser } from "../notification/notification.service.js";
import { prisma } from "../../config/prisma.js";

export async function createCommentController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { postId } = req.params as { postId: string };
    const authorId = req.user!.userId;
    const body = createCommentSchema.parse(req.body);

    const comment = await createComment(postId, authorId, body);

    // Emit real-time event (non-blocking)
    try {
      socketManager.emitToRoom(`post_${postId}`, "new_comment", { postId, comment });
    } catch {}

    // Notify post author (if not self-comment) — non-blocking
    prisma.post.findUnique({ where: { id: postId }, select: { author_id: true, title: true } })
      .then((post) => {
        if (post && post.author_id !== authorId) {
          prisma.user.findUnique({ where: { id: authorId }, select: { full_name: true } })
            .then((user) => {
              notifyUser({
                user_id: post.author_id,
                type: "NEW_COMMENT",
                title: "New comment on your post",
                body: `${user?.full_name || "Someone"} commented on your post${post.title ? ": " + post.title : ""}`,
                reference_type: "post",
                reference_id: postId,
                category: "social",
              });
              try {
                socketManager.emitToRoom(`user_${post.author_id}`, "new_notification", {
                  type: "NEW_COMMENT", title: "New comment on your post",
                  body: `${user?.full_name || "Someone"} commented on your post`,
                });
              } catch {}
            })
            .catch(() => {});
        }

        // If reply, also notify parent comment author
        if (body.parent_id) {
          prisma.comment.findUnique({ where: { id: body.parent_id }, select: { author_id: true } })
            .then((parentComment) => {
              if (parentComment && parentComment.author_id !== authorId && parentComment.author_id !== post?.author_id) {
                prisma.user.findUnique({ where: { id: authorId }, select: { full_name: true } })
                  .then((user) => {
                    notifyUser({
                      user_id: parentComment.author_id,
                      type: "NEW_REPLY",
                      title: "New reply to your comment",
                      body: `${user?.full_name || "Someone"} replied to your comment`,
                      reference_type: "post",
                      reference_id: postId,
                      category: "social",
                    });
                    try {
                      socketManager.emitToRoom(`user_${parentComment.author_id}`, "new_notification", {
                        type: "NEW_REPLY", title: "New reply to your comment",
                        body: `${user?.full_name || "Someone"} replied to your comment`,
                      });
                    } catch {}
                  })
                  .catch(() => {});
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    return reply.status(201).send({ success: true, data: comment });
  } catch (err: any) {
    if (err.message === "POST_NOT_FOUND")
      return reply.status(404).send({ success: false, message: "Post not found" });
    if (err.message === "PARENT_NOT_FOUND")
      return reply.status(404).send({ success: false, message: "Parent comment not found" });
    console.error("[Comment] create error:", err.message);
    return reply.status(500).send({ success: false, message: "Failed to create comment" });
  }
}

export async function getCommentsController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { postId } = req.params as { postId: string };
    const query = commentQuerySchema.parse(req.query);
    const result = await getCommentsByPost(postId, query);
    return reply.send({ success: true, ...result });
  } catch (err: any) {
    return reply.status(500).send({ success: false, message: "Failed to get comments" });
  }
}

export async function updateCommentController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { commentId } = req.params as { commentId: string };
    const authorId = req.user!.userId;
    const body = updateCommentSchema.parse(req.body);
    const comment = await updateComment(commentId, authorId, body);
    return reply.send({ success: true, data: comment });
  } catch (err: any) {
    if (err.message === "NOT_FOUND")
      return reply.status(404).send({ success: false, message: "Comment not found" });
    if (err.message === "FORBIDDEN")
      return reply.status(403).send({ success: false, message: "Not your comment" });
    return reply.status(500).send({ success: false, message: "Failed to update comment" });
  }
}

export async function deleteCommentController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { commentId } = req.params as { commentId: string };
    const authorId = req.user!.userId;
    await deleteComment(commentId, authorId);
    return reply.send({ success: true, message: "Comment deleted" });
  } catch (err: any) {
    if (err.message === "NOT_FOUND")
      return reply.status(404).send({ success: false, message: "Comment not found" });
    if (err.message === "FORBIDDEN")
      return reply.status(403).send({ success: false, message: "Not your comment" });
    return reply.status(500).send({ success: false, message: "Failed to delete comment" });
  }
}

export async function getRepliesController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { commentId } = req.params as { commentId: string };
    const query = commentQuerySchema.parse(req.query);
    const result = await getReplies(commentId, query);
    return reply.send({ success: true, ...result });
  } catch (err: any) {
    return reply.status(500).send({ success: false, message: "Failed to get replies" });
  }
}
