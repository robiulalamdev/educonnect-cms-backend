import { FastifyInstance } from "fastify";
import { 
  createServiceController, 
  getServiceListController, 
  getServiceByIdController, 
  updateServiceController, 
  getTeacherServicesController, 
  getAdminServicesController, 
  getServicesDropdownController 
} from "./service.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";

export async function serviceRoutes(fastify: FastifyInstance) {
  // ── Root / Public ──────────────────────────────────────────
  fastify.get("/", getServiceListController);
  fastify.get("/:id", getServiceByIdController);
  fastify.get("/dropdown/root", getServicesDropdownController);

  // ── Profile / Own Data ─────────────────────────────────────
  fastify.register(async (profileRoutes) => {
    profileRoutes.addHook("preHandler", authenticate);
    profileRoutes.addHook("preHandler", requireRole("TEACHER"));

    profileRoutes.post("/teacher", createServiceController);
    profileRoutes.get("/teacher", getTeacherServicesController);
    profileRoutes.patch("/teacher/:id", updateServiceController);
    profileRoutes.get("/teacher/dropdown", getServicesDropdownController);
  }, { prefix: "/profile" });

  // ── Dashboard / Admin ──────────────────────────────────────
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook("preHandler", authenticate);
    adminRoutes.addHook("preHandler", requireRole("SUPER_ADMIN", "ADMIN", "MODERATOR"));

    adminRoutes.get("/", getAdminServicesController);
    adminRoutes.get("/dropdown", getServicesDropdownController);
    // Add more admin management (approve/delete) here if required
  }, { prefix: "/dashboard" });
}
