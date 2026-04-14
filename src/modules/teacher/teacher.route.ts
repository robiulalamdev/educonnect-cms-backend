import { FastifyInstance } from "fastify";
import { verifyUserToken, requireUserRole } from "../auth/auth.middleware.js";
import { updateTeacherProfileController } from "./teacher.controller.js";

export async function teacherRoutes(fastify: FastifyInstance) {
  // PATCH /api/v1/teacher/profile
  fastify.patch(
    "/profile",
    { preHandler: [verifyUserToken, requireUserRole("TEACHER")] },
    updateTeacherProfileController,
  );
}
