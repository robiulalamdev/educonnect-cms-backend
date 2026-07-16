import { FastifyRequest, FastifyReply } from "fastify";
import { createCommentSchema, updateCommentSchema, commentQuerySchema } from "./comment.schema.js";
import { createComment, getCommentsByPost, updateComment, deleteComment, getReplies } from "./comment.service.js";
import { socketManager } from "../../config/socket.js";
import { notifyUser } from "../notification/notification.service.js";
import { prisma } from "../../config/prisma.js";

export async function createCommentController(req: FastifyRequest, reply: FastifyReply) {
  const { postId } = req.params as { postId: string };
  const authorId = req.user!.userId;
  const body = createCommentSchema.parse(req.body);

  const comment = await createComment(postId, authorId, body);

  // Emit real-time event
  socketManager.emitToRoom(`post_${postId}`, "new_comment", {
    postId,
    comment,
  });

  // Notify post author (if not self-comment)
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { author_id: true, title: true } });
  if (post && post.author_id !== authorId) {
    const user = await prisma.user.findUnique({ where: { id: authorId }, select: { full_name: true } });
    notifyUser({
      user_id: post.author_id,
      type: "NEW_COMMENT",
      title: "New comment on your post",
      body: `${user?.full_name || "Someone"} commented on your post${post.title ? ": " + post.title : ""}`,
      reference_type: "post",
      reference_id: postId,
      category: "social",
    });
    socketManager.emitToRoom(`user_${post.author_id}`, "new_notification", {
      type: "NEW_COMMENT",
      title: "New comment on your post",
      body: `${user?.full_name || "Someone"} commented on your post`,
    });
  }

  // If reply, also notify parent comment author
  if (body.parent_id) {
    const parentComment = await prisma.comment.findUnique({ where: { id: body.parent_id }, select: { author_id: true } });
    if (parentComment && parentComment.author_id !== authorId && parentComment.author_id !== post?.author_id) {
      const user = await prisma.user.findUnique({ where: { id: authorId }, select: { full_name: true } });
      notifyUser({
        user_id: parentComment.author_id,
        type: "NEW_REPLY",
        title: "New reply to your comment",
        body: `${user?.full_name || "Someone"} replied to your comment`,
        reference_type: "post",
        reference_id: postId,
        category: "social",
      });
      socketManager.emitToRoom(`user_${parentComment.author_id}`, "new_notification", {
        type: "NEW_REPLY",
        title: "New reply to your comment",
        body: `${user?.full_name || "Someone"} replied to your comment`,
      });
    }
  }

  return reply.status(201).send({ success: true, data: comment });
}

export async function getCommentsController(req: FastifyRequest, reply: FastifyReply) {
  const { postId } = req.params as { postId: string };
  const query = commentQuerySchema.parse(req.query);

  const result = await getCommentsByPost(postId, query);
  return reply.send({ success: true, ...result });
}

export async function updateCommentController(req: FastifyRequest, reply: FastifyReply) {
  const { commentId } = req.params as { commentId: string };
  const authorId = req.user!.userId;
  const body = updateCommentSchema.parse(req.body);

  const comment = await updateComment(commentId, authorId, body);
  return reply.send({ success: true, data: comment });
}

export async function deleteCommentController(req: FastifyRequest, reply: FastifyReply) {
  const { commentId } = req.params as { commentId: string };
  const authorId = req.user!.userId;

  await deleteComment(commentId, authorId);
  return reply.send({ success: true, message: "Comment deleted" });
}

export async function getRepliesController(req: FastifyRequest, reply: FastifyReply) {
  const { commentId } = req.params as { commentId: string };
  const query = commentQuerySchema.parse(req.query);

  const result = await getReplies(commentId, query);
  return reply.send({ success: true, ...result });
}
