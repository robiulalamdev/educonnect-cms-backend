import { FastifyInstance } from "fastify";
import { verifyUserToken, requireUserRole } from "../auth/auth.middleware.js";
import { USER_TYPES } from "../user/user.types.js";
import { 
  updateStudentProfileController, 
  getStudentMeController 
} from "./student.controller.js";

export async function studentRoutes(fastify: FastifyInstance) {
  fastify.register(async (privateRoutes) => {
    privateRoutes.addHook("preHandler", verifyUserToken);
    privateRoutes.addHook("preHandler", requireUserRole(USER_TYPES.ROLE_OBJECT.STUDENT));

    // GET /api/v1/student/me
    privateRoutes.get("/me", getStudentMeController);

    // PATCH /api/v1/student/profile
    privateRoutes.patch("/profile", updateStudentProfileController);
  });
}
