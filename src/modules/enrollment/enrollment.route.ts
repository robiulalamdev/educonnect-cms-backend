import { FastifyInstance } from "fastify";
import {
  createEnrollmentController,
  submitPaymentController,
  getMyEnrollmentsController,
  getTeacherEnrollmentsController,
  getAdminEnrollmentsController,
  updatePaymentStatusController,
  updateEnrollmentStatusController,
  getEnrollmentsDropdownController,
} from "./enrollment.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import { ADMIN_TYPES } from "../admin/admin.types.js";

export async function enrollmentRoutes(fastify: FastifyInstance) {
  // ── Profile / Own Data ─────────────────────────────────────
  fastify.register(async (profileRoutes) => {
    profileRoutes.addHook("preHandler", authenticate);

    // Student Routes
    profileRoutes.post("/student", { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.STUDENT)] }, createEnrollmentController);
    profileRoutes.post("/student/:id/payment", { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.STUDENT)] }, submitPaymentController);
    profileRoutes.get("/student", { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.STUDENT)] }, getMyEnrollmentsController);
    profileRoutes.get("/student/dropdown", { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.STUDENT)] }, getEnrollmentsDropdownController);

    // Teacher Routes
    profileRoutes.get("/teacher", { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] }, getTeacherEnrollmentsController);
    profileRoutes.patch("/teacher/payment/:id", { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] }, updatePaymentStatusController);
    profileRoutes.patch("/teacher/:id/status", { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] }, updateEnrollmentStatusController);
    profileRoutes.get("/teacher/dropdown", { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] }, getEnrollmentsDropdownController);
  }, { prefix: "/profile" });

  // ── Dashboard / Admin ──────────────────────────────────────
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook("preHandler", authenticate);
    adminRoutes.addHook("preHandler", requireRole(...ADMIN_TYPES.PERMISSIONS.CAN_VIEW));

    adminRoutes.get("/", getAdminEnrollmentsController);
    adminRoutes.patch("/payment/:id", updatePaymentStatusController);
    adminRoutes.patch("/:id/status", updateEnrollmentStatusController);
    adminRoutes.get("/dropdown", getEnrollmentsDropdownController);
  }, { prefix: "/dashboard" });
}
