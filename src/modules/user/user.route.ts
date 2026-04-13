import { FastifyInstance } from "fastify";
import { verifyUserToken } from "../auth/auth.middleware.js";
import { getUsersController, getUserByIdController } from "./user.controller.js";

export async function userRoutes(fastify: FastifyInstance) {
  // GET /api/v1/user
  fastify.get(
    "/",
    { preHandler: [verifyUserToken] },
    getUsersController,
  );

  // GET /api/v1/user/:id
  fastify.get(
    "/:id",
    { preHandler: [verifyUserToken] },
    getUserByIdController,
  );
}