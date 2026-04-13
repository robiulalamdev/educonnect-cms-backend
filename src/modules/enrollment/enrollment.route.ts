import { FastifyInstance } from "fastify";
import { 
  createEnrollmentController, 
  submitPaymentController, 
  getMyEnrollmentsController, 
  getTeacherEnrollmentsController, 
  getAdminEnrollmentsController, 
  updatePaymentStatusController, 
  getEnrollmentsDropdownController 
} from "./enrollment.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";

export async function enrollmentRoutes(fastify: FastifyInstance) {
  // ── Profile / Own Data ─────────────────────────────────────
  fastify.register(async (profileRoutes) => {
    profileRoutes.addHook("preHandler", authenticate);
    
    // Student Routes
    profileRoutes.post("/student", { preHandler: [requireRole("STUDENT")] }, createEnrollmentController);
    profileRoutes.post("/student/:id/payment", { preHandler: [requireRole("STUDENT")] }, submitPaymentController);
    profileRoutes.get("/student", { preHandler: [requireRole("STUDENT")] }, getMyEnrollmentsController);
    profileRoutes.get("/student/dropdown", { preHandler: [requireRole("STUDENT")] }, getEnrollmentsDropdownController);

    // Teacher Routes
    profileRoutes.get("/teacher", { preHandler: [requireRole("TEACHER")] }, getTeacherEnrollmentsController);
    profileRoutes.patch("/teacher/payment/:id", { preHandler: [requireRole("TEACHER")] }, updatePaymentStatusController);
    profileRoutes.get("/teacher/dropdown", { preHandler: [requireRole("TEACHER")] }, getEnrollmentsDropdownController);
  }, { prefix: "/profile" });

  // ── Dashboard / Admin ──────────────────────────────────────
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook("preHandler", authenticate);
    adminRoutes.addHook("preHandler", requireRole("SUPER_ADMIN", "ADMIN", "MODERATOR"));

    adminRoutes.get("/", getAdminEnrollmentsController);
    adminRoutes.patch("/payment/:id", updatePaymentStatusController);
    adminRoutes.get("/dropdown", getEnrollmentsDropdownController);
  }, { prefix: "/dashboard" });
}
