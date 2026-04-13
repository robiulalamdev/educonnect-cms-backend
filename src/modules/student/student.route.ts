import { FastifyInstance } from "fastify";
import { verifyUserToken, requireUserRole } from "../auth/auth.middleware.js";
import { updateStudentProfileController } from "../user/user.controller.js";

export async function studentRoutes(fastify: FastifyInstance) {
  // PATCH /api/v1/student/profile
  fastify.patch(
    "/profile",
    { preHandler: [verifyUserToken, requireUserRole("STUDENT")] },
    updateStudentProfileController,
  );
}
