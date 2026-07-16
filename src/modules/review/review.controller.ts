import { FastifyRequest, FastifyReply } from "fastify";
import { createReviewSchema, replyReviewSchema, reviewQuerySchema } from "./review.schema.js";
import { createReview, replyToReview, getReviewList, hideReview } from "./review.service.js";

export async function createReviewController(req: FastifyRequest, reply: FastifyReply) {
  const studentId = req.user!.userId;
  const input = createReviewSchema.parse(req.body);
  const data = await createReview(studentId, input);
  return reply.status(201).send({ success: true, message: "Review submitted", data });
}

export async function replyToReviewController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { id } = req.params as { id: string };
  const input = replyReviewSchema.parse(req.body);
  const data = await replyToReview(teacherId, id, input);
  return reply.send({ success: true, message: "Reply added", data });
}

export async function getReviewListController(req: FastifyRequest, reply: FastifyReply) {
  const query = reviewQuerySchema.parse(req.query);
  const data = await getReviewList(query);
  return reply.send({ success: true, ...data });
}

export async function hideReviewController(req: FastifyRequest, reply: FastifyReply) {
  const adminId = req.admin!.adminId;
  const { id } = req.params as { id: string };
  const data = await hideReview(adminId, id);
  return reply.send({ success: true, message: "Review hidden", data });
}
