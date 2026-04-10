import { FastifyInstance } from "fastify";
import { verifyAdminToken, requireRole } from "./admin.middleware.js";
import { ADMIN_TYPES } from "./admin.types.js";
import {
  loginController,
  refreshController,
  logoutController,
  profileController,
  changePasswordController,
  registerController,
  getAdminsController,
  getAdminByIdController,
  updateAdminController,
  updateProfileController,
  deleteAdminController,
} from "./admin.controller.js";

const {
  CAN_VIEW_ADMINS,
  CAN_EDIT_ADMIN,
  CAN_REGISTER_ADMIN,
  CAN_DELETE_ADMIN,
} = ADMIN_TYPES.PERMISSIONS;

export async function adminRoutes(fastify: FastifyInstance) {
  // ── Auth Section — /auth/admin ──────────────────────────
  fastify.post("/auth/admin/login", loginController);
  fastify.post("/auth/admin/refresh", refreshController);
  fastify.post("/auth/admin/logout", { preHandler: [verifyAdminToken] }, logoutController);
  fastify.get("/auth/admin/me", { preHandler: [verifyAdminToken] }, profileController);
  fastify.patch("/auth/admin/me", { preHandler: [verifyAdminToken] }, updateProfileController);
  fastify.patch(
    "/auth/admin/me/password",
    { preHandler: [verifyAdminToken] },
    changePasswordController,
  );

  // ── Dashboard Management — /dashboard/admins ───────────
  fastify.post(
    "/dashboard/admins/register",
    { preHandler: [verifyAdminToken, requireRole(...CAN_REGISTER_ADMIN)] },
    registerController,
  );
  fastify.get(
    "/dashboard/admins/list",
    { preHandler: [verifyAdminToken, requireRole(...CAN_VIEW_ADMINS)] },
    getAdminsController,
  );
  fastify.get(
    "/dashboard/admins/:id",
    { preHandler: [verifyAdminToken, requireRole(...CAN_VIEW_ADMINS)] },
    getAdminByIdController,
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
}

