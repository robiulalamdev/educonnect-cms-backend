import { FastifyRequest, FastifyReply } from "fastify";
import { paymentListQuerySchema } from "./payment.schema.js";
import { getPaymentList, getPaymentById, getStudentPaymentHistory, getPaymentStats } from "./payment.service.js";

/**
 * GET / — List all payment records (admin/teacher)
 */
export async function getPaymentListController(req: FastifyRequest, reply: FastifyReply) {
  const query = paymentListQuerySchema.safeParse(req.query);
  if (!query.success) {
    return reply.status(400).send({ success: false, errors: query.error.flatten().fieldErrors });
  }

  try {
    // Teachers can only see payments for their services
    const isTeacher = req.user?.role === "TEACHER";
    const isAdmin = !!req.admin;

    const result = await getPaymentList({
      ...query.data,
      ...(isTeacher && !isAdmin && { teacher_id: req.user!.userId }),
    });

    return reply.send({ success: true, ...result });
  } catch (err: any) {
    throw err;
  }
}

/**
 * GET /:id — Get payment record by ID
 */
export async function getPaymentByIdController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };

  try {
    const payment = await getPaymentById(id);

    // Teachers can only see payments for their own services
    const isTeacher = req.user?.role === "TEACHER";
    if (isTeacher && !req.admin) {
      if (payment.enrollment.batch.service.teacher_id !== req.user!.userId) {
        return reply.status(403).send({ success: false, message: "Forbidden" });
      }
    }

    return reply.send({ success: true, data: payment });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      return reply.status(404).send({ success: false, message: "Payment not found" });
    }
    throw err;
  }
}

/**
 * GET /history — Get student's own payment history
 */
export async function getPaymentHistoryController(req: FastifyRequest, reply: FastifyReply) {
  const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number };

  try {
    const result = await getStudentPaymentHistory(req.user!.userId, Number(page), Number(limit));
    return reply.send({ success: true, ...result });
  } catch (err: any) {
    if (err.message === "STUDENT_PROFILE_NOT_FOUND") {
      return reply.status(404).send({ success: false, message: "Student profile not found" });
    }
    throw err;
  }
}

/**
 * GET /stats — Get payment stats (admin or teacher)
 */
export async function getPaymentStatsController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const isTeacher = req.user?.role === "TEACHER";
    const stats = await getPaymentStats(
      isTeacher && !req.admin ? req.user!.userId : undefined,
    );
    return reply.send({ success: true, data: stats });
  } catch (err: any) {
    throw err;
  }
}
