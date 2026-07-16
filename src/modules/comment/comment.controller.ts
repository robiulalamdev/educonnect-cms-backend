import { FastifyRequest, FastifyReply } from "fastify";
import { createCommentSchema, updateCommentSchema, commentQuerySchema } from "./comment.schema.js";
import { createComment, getCommentsByPost, updateComment, deleteComment, getReplies } from "./comment.service.js";
import { socketManager } from "../../config/socket.js";

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
