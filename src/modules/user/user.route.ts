import { FastifyInstance } from "fastify";
import { verifyUserToken } from "../auth/auth.middleware.js";
import { getUsersController, getUserByIdController, getSuggestedUsersController, getUserByUsernameController } from "./user.controller.js";

export async function userRoutes(fastify: FastifyInstance) {
  // GET /api/v1/user
  fastify.get(
    "/",
    { preHandler: [verifyUserToken] },
    getUsersController,
  );

  // GET /api/v1/user/by-username/:username (PUBLIC - no auth)
  fastify.get(
    "/by-username/:username",
    getUserByUsernameController,
  );

  // GET /api/v1/user/suggestions
  fastify.get(
    "/suggestions",
    { preHandler: [verifyUserToken] },
    getSuggestedUsersController,
  );

  // GET /api/v1/user/:id
  fastify.get(
    "/:id",
    { preHandler: [verifyUserToken] },
    getUserByIdController,
  );
}