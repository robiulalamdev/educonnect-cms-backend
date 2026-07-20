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
import {
  getUserListController,
  getUserByIdController,
  createUserByAdminController,
  updateUserByAdminController,
  approveTeacherController,
  suspendUserController,
  banUserController,
  reactivateUserController,
  deleteUserController,
} from "./user-management.controller.js";
import { getAdminPostsController } from "../post/post.controller.js";
import {
  getReviewListController,
  hideReviewController,
} from "../review/review.controller.js";
import { getPackagesController } from "../subscription/subscription.controller.js";
import { getAdminStatsController } from "../statistics/statistics.controller.js";
import {
  adminDirectLinkController,
  adminGetAllLinksController,
  adminRemoveLinkController,
} from "../guardian/guardian.controller.js";

const {
  CAN_VIEW_ADMINS,
  CAN_EDIT_ADMIN,
  CAN_REGISTER_ADMIN,
  CAN_DELETE_ADMIN,
  CAN_VIEW_AUDIT_LOG,
  CAN_MODERATE_POST,
  CAN_MODERATE_REVIEW,
  CAN_MANAGE_GUARDIAN_LINKS,
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

  // ── User Management — /api/v1/admin/dashboard/users ──────
  fastify.post(
    "/dashboard/users",
    { preHandler: [verifyAdminToken, requireRole(...CAN_REGISTER_ADMIN)] },
    createUserByAdminController,
  );
  fastify.get(
    "/dashboard/users",
    { preHandler: [verifyAdminToken, requireRole(...CAN_VIEW_ADMINS)] },
    getUserListController,
  );
  fastify.get(
    "/dashboard/users/:id",
    { preHandler: [verifyAdminToken, requireRole(...CAN_VIEW_ADMINS)] },
    getUserByIdController,
  );
  fastify.patch(
    "/dashboard/users/:id",
    { preHandler: [verifyAdminToken, requireRole(...CAN_EDIT_ADMIN)] },
    updateUserByAdminController,
  );
  fastify.patch(
    "/dashboard/users/:id/approve-teacher",
    { preHandler: [verifyAdminToken, requireRole(...CAN_EDIT_ADMIN)] },
    approveTeacherController,
  );
  fastify.patch(
    "/dashboard/users/:id/suspend",
    { preHandler: [verifyAdminToken, requireRole(...CAN_EDIT_ADMIN)] },
    suspendUserController,
  );
  fastify.patch(
    "/dashboard/users/:id/ban",
    { preHandler: [verifyAdminToken, requireRole(...CAN_DELETE_ADMIN)] },
    banUserController,
  );
  fastify.patch(
    "/dashboard/users/:id/reactivate",
    { preHandler: [verifyAdminToken, requireRole(...CAN_EDIT_ADMIN)] },
    reactivateUserController,
  );
  fastify.delete(
    "/dashboard/users/:id",
    { preHandler: [verifyAdminToken, requireRole(...CAN_DELETE_ADMIN)] },
    deleteUserController,
  );

  // ── Posts — /api/v1/admin/dashboard/posts ────────────────
  fastify.get(
    "/dashboard/posts",
    { preHandler: [verifyAdminToken, requireRole(...CAN_VIEW_ADMINS)] },
    getAdminPostsController,
  );

  // ── Reviews — /api/v1/admin/dashboard/reviews ───────────
  fastify.get(
    "/dashboard/reviews",
    { preHandler: [verifyAdminToken, requireRole(...CAN_VIEW_ADMINS)] },
    getReviewListController,
  );
  fastify.patch(
    "/dashboard/reviews/:id/hide",
    { preHandler: [verifyAdminToken, requireRole(...CAN_MODERATE_REVIEW)] },
    hideReviewController,
  );

  // ── Subscriptions — /api/v1/admin/dashboard/subscriptions ─
  fastify.get(
    "/dashboard/subscriptions",
    { preHandler: [verifyAdminToken, requireRole(...CAN_VIEW_ADMINS)] },
    getPackagesController,
  );

  // ── Statistics — /api/v1/admin/dashboard/stats ───────────
  fastify.get(
    "/dashboard/stats",
    { preHandler: [verifyAdminToken, requireRole(...CAN_VIEW_AUDIT_LOG)] },
    getAdminStatsController,
  );

  // ── Guardian-Student Links — /api/v1/admin/dashboard/guardian-links ─
  fastify.get(
    "/dashboard/guardian-links",
    { preHandler: [verifyAdminToken, requireRole(...CAN_MANAGE_GUARDIAN_LINKS)] },
    adminGetAllLinksController,
  );
  fastify.post(
    "/dashboard/guardian-links",
    { preHandler: [verifyAdminToken, requireRole(...CAN_MANAGE_GUARDIAN_LINKS)] },
    adminDirectLinkController,
  );
  fastify.delete(
    "/dashboard/guardian-links/:id",
    { preHandler: [verifyAdminToken, requireRole(...CAN_MANAGE_GUARDIAN_LINKS)] },
    adminRemoveLinkController,
  );
}
