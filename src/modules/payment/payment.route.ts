import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import { ADMIN_TYPES } from "../admin/admin.types.js";
import {
  getPaymentListController,
  getPaymentByIdController,
  getPaymentHistoryController,
  getPaymentStatsController,
} from "./payment.controller.js";

export async function paymentRoutes(fastify: FastifyInstance) {
  // ── All payment routes require auth ──────────────────────
  fastify.addHook("preHandler", authenticate);

  // GET / — List payment records (admin or teacher)
  fastify.get(
    "/",
    { preHandler: [requireRole(...ADMIN_TYPES.PERMISSIONS.CAN_VIEW, USER_TYPES.ROLE_OBJECT.TEACHER)] },
    getPaymentListController,
  );

  // GET /stats — Payment stats summary
  fastify.get(
    "/stats",
    { preHandler: [requireRole(...ADMIN_TYPES.PERMISSIONS.CAN_VIEW, USER_TYPES.ROLE_OBJECT.TEACHER)] },
    getPaymentStatsController,
  );

  // GET /history — Student's own payment history
  fastify.get(
    "/history",
    { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.STUDENT, USER_TYPES.ROLE_OBJECT.GUARDIAN)] },
    getPaymentHistoryController,
  );

  // GET /:id — Get payment by ID
  fastify.get(
    "/:id",
    { preHandler: [requireRole(...ADMIN_TYPES.PERMISSIONS.CAN_VIEW, USER_TYPES.ROLE_OBJECT.TEACHER, USER_TYPES.ROLE_OBJECT.STUDENT)] },
    getPaymentByIdController,
  );
}
