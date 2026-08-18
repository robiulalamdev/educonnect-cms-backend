import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import { ADMIN_TYPES } from "../admin/admin.types.js";
import {
  getPackagesController,
  getPackageByIdController,
  getMySubscriptionController,
  getMySubscriptionHistoryController,
  subscribeController,
  createPackageController,
  updatePackageController,
  archivePackageController,
  addPackageFeatureController,
  deletePackageFeatureController,
  grantSubscriptionController,
  revokeSubscriptionController,
} from "./subscription.controller.js";

const ALL_USERS = [USER_TYPES.ROLE_OBJECT.TEACHER, USER_TYPES.ROLE_OBJECT.STUDENT, USER_TYPES.ROLE_OBJECT.GUARDIAN];

export async function subscriptionRoutes(fastify: FastifyInstance) {
  // Public: list packages
  fastify.get("/packages", getPackagesController);
  fastify.get("/packages/:id", getPackageByIdController);

  // Authenticated: user subscription
  fastify.get("/me", { preHandler: [authenticate, requireRole(...ALL_USERS)] }, getMySubscriptionController);
  fastify.get("/me/history", { preHandler: [authenticate, requireRole(...ALL_USERS)] }, getMySubscriptionHistoryController);
  fastify.post("/subscribe", { preHandler: [authenticate, requireRole(...ALL_USERS)] }, subscribeController);

  // Admin: package CRUD + grant/revoke
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook("preHandler", authenticate);
    adminRoutes.addHook("preHandler", requireRole(...ADMIN_TYPES.PERMISSIONS.CAN_VIEW));

    adminRoutes.post("/packages", createPackageController);
    adminRoutes.patch("/packages/:id", updatePackageController);
    adminRoutes.patch("/packages/:id/archive", archivePackageController);
    adminRoutes.post("/packages/:id/features", addPackageFeatureController);
    adminRoutes.delete("/packages/:id/features/:featureId", deletePackageFeatureController);
    adminRoutes.post("/admin/grant", grantSubscriptionController);
    adminRoutes.patch("/admin/revoke/:userId", revokeSubscriptionController);
  }, { prefix: "/admin" });
}
