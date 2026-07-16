import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import { ADMIN_TYPES } from "../admin/admin.types.js";
import {
  createServiceController,
  getServiceListController,
  getServiceByIdController,
  updateServiceController,
  getTeacherServicesController,
  getAdminServicesController,
  getServicesDropdownController,
} from "./service.controller.js";

export async function serviceRoutes(fastify: FastifyInstance) {
  // ── Root / Public ──────────────────────────────────────────
  fastify.get("/", getServiceListController);
  fastify.get("/:id", getServiceByIdController);
  fastify.get("/dropdown/root", getServicesDropdownController);

  // ── Profile / Teacher ──────────────────────────────────────
  fastify.register(async (profileRoutes) => {
    profileRoutes.addHook("preHandler", authenticate);
    profileRoutes.addHook("preHandler", requireRole(USER_TYPES.ROLE_OBJECT.TEACHER));

    profileRoutes.post("/teacher", createServiceController);
    profileRoutes.get("/teacher", getTeacherServicesController);
    profileRoutes.patch("/teacher/:id", updateServiceController);
    profileRoutes.get("/teacher/dropdown", getServicesDropdownController);
  }, { prefix: "/profile" });

  // ── Dashboard / Admin ──────────────────────────────────────
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook("preHandler", authenticate);
    adminRoutes.addHook("preHandler", requireRole(...ADMIN_TYPES.PERMISSIONS.CAN_VIEW));

    adminRoutes.get("/", getAdminServicesController);
    adminRoutes.get("/dropdown", getServicesDropdownController);
  }, { prefix: "/dashboard" });
}
