import { FastifyInstance } from "fastify";
import { verifyUserToken, requireUserRole } from "../auth/auth.middleware.js";
import { USER_TYPES } from "../user/user.types.js";
import { 
  updateTeacherProfileController, 
  getTeacherDetailsController 
} from "./teacher.controller.js";

export async function teacherRoutes(fastify: FastifyInstance) {
  // Public teacher details
  fastify.get("/:id", getTeacherDetailsController);

  // Private profile management
  fastify.register(async (privateRoutes) => {
    privateRoutes.addHook("preHandler", verifyUserToken);
    privateRoutes.addHook("preHandler", requireUserRole(USER_TYPES.ROLE_OBJECT.TEACHER));

    // PATCH /api/v1/teacher/profile
    privateRoutes.patch("/profile", updateTeacherProfileController);
  });
}
