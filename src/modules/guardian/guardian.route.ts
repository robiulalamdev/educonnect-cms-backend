import { FastifyInstance } from "fastify";
import { verifyUserToken, requireUserRole } from "../auth/auth.middleware.js";
import { USER_TYPES } from "../user/user.types.js";
import { 
  updateGuardianProfileController, 
  getGuardianMeController 
} from "./guardian.controller.js";

export async function guardianRoutes(fastify: FastifyInstance) {
  fastify.register(async (privateRoutes) => {
    privateRoutes.addHook("preHandler", verifyUserToken);
    privateRoutes.addHook("preHandler", requireUserRole(USER_TYPES.ROLE_OBJECT.GUARDIAN));

    // GET /api/v1/guardian/me
    privateRoutes.get("/me", getGuardianMeController);

    // PATCH /api/v1/guardian/profile
    privateRoutes.patch("/profile", updateGuardianProfileController);
  });
}
