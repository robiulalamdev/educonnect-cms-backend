import { FastifyInstance } from "fastify";
import { verifyAdminToken, requireRole } from "./admin.middleware.js";
import { ADMIN_TYPES } from "./admin.types.js";
import {
  loginController,
  refreshController,
  logoutController,
  getMeController,
  updateMeController,
  changePasswordController,
  registerAdminController,
  getAdminListController,
  getAdminByIdController,
  updateAdminController,
  deleteAdminController,
  getAuditLogsController,
} from "./admin.controller.js";

const {
  CAN_VIEW_ADMINS,
  CAN_EDIT_ADMIN,
  CAN_REGISTER_ADMIN,
  CAN_DELETE_ADMIN,
  CAN_VIEW_AUDIT_LOG,
} = ADMIN_TYPES.PERMISSIONS;

export async function adminRoutes(fastify: FastifyInstance) {
  // ── Auth — /api/v1/admin/auth ──────────────────────────
  fastify.post("/auth/login", loginController);
  fastify.post("/auth/refresh", refreshController);
  fastify.post(
    "/auth/logout",
    { preHandler: [verifyAdminToken] },
    logoutController,
  );

  // ── Own Profile — /api/v1/admin/auth/me ───────────────
  fastify.get("/auth/me", { preHandler: [verifyAdminToken] }, getMeController);
  fastify.patch(
    "/auth/me",
    { preHandler: [verifyAdminToken] },
    updateMeController,
  );
  fastify.patch(
    "/auth/me/password",
    { preHandler: [verifyAdminToken] },
    changePasswordController,
  );

  // ── Admin Management — /api/v1/admin/dashboard/admins ─
  fastify.post(
    "/dashboard/admins",
    { preHandler: [verifyAdminToken, requireRole(...CAN_REGISTER_ADMIN)] },
    registerAdminController,
  );
  fastify.get(
    "/dashboard/admins",
    { preHandler: [verifyAdminToken, requireRole(...CAN_VIEW_ADMINS)] },
    getAdminListController,
  );
  fastify.patch(
    "/dashboard/admins/:id",
    { preHandler: [verifyAdminToken, requireRole(...CAN_EDIT_ADMIN)] },
    updateAdminController,
  );
  fastify.delete(
    "/dashboard/admins/:id",
    { preHandler: [verifyAdminToken, requireRole(...CAN_DELETE_ADMIN)] },
    deleteAdminController,
  );

  // ── Audit Logs — /api/v1/admin/dashboard/audit-logs ──────
  fastify.get(
    "/dashboard/audit-logs",
    { preHandler: [verifyAdminToken, requireRole(...CAN_VIEW_AUDIT_LOG)] },
    getAuditLogsController,
  );
}
