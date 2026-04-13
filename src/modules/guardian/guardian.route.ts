import { FastifyInstance } from "fastify";
import { verifyUserToken, requireUserRole } from "../auth/auth.middleware.js";
import {
  requestLinkController,
  getGuardianLinksController,
  getStudentLinksController,
  respondToLinkController,
} from "./guardian.controller.js";

export async function guardianRoutes(fastify: FastifyInstance) {
  // Guardian routes
  fastify.post(
    "/link",
    { preHandler: [verifyUserToken, requireUserRole("GUARDIAN")] },
    requestLinkController,
  );

  fastify.get(
    "/links",
    { preHandler: [verifyUserToken, requireUserRole("GUARDIAN")] },
    getGuardianLinksController,
  );

  // Student routes (receiving links)
  fastify.get(
    "/requests",
    { preHandler: [verifyUserToken, requireUserRole("STUDENT")] },
    getStudentLinksController,
  );

  fastify.post(
    "/respond",
    { preHandler: [verifyUserToken, requireUserRole("STUDENT")] },
    respondToLinkController,
  );
}
