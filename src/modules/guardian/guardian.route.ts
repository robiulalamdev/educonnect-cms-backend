import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import {
  updateGuardianProfileController,
  getGuardianMeController,
  sendLinkRequestController,
  respondToLinkRequestController,
  getMyLinksController,
  removeLinkController,
} from "./guardian.controller.js";

const LINK_ROLES = [USER_TYPES.ROLE_OBJECT.GUARDIAN, USER_TYPES.ROLE_OBJECT.STUDENT];

export async function guardianRoutes(fastify: FastifyInstance) {
  fastify.register(async (privateRoutes) => {
    privateRoutes.addHook("preHandler", authenticate);

    // Guardian profile
    privateRoutes.get("/me", { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.GUARDIAN)] }, getGuardianMeController);
    privateRoutes.patch("/profile", { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.GUARDIAN)] }, updateGuardianProfileController);

    // Guardian-Student Link Requests
    privateRoutes.post("/link-request", { preHandler: [requireRole(...LINK_ROLES)] }, sendLinkRequestController);
    privateRoutes.patch("/link-request/:id/respond", { preHandler: [requireRole(...LINK_ROLES)] }, respondToLinkRequestController);
    privateRoutes.get("/links", { preHandler: [requireRole(...LINK_ROLES)] }, getMyLinksController);
    privateRoutes.delete("/links/:id", { preHandler: [requireRole(...LINK_ROLES)] }, removeLinkController);
  });
}
