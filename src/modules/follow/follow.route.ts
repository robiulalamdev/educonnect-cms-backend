import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import {
  followUserController,
  unfollowUserController,
  getFollowersController,
  getFollowingController,
  checkFollowStatusController,
} from "./follow.controller.js";

const ALL_USERS = [USER_TYPES.ROLE_OBJECT.TEACHER, USER_TYPES.ROLE_OBJECT.STUDENT, USER_TYPES.ROLE_OBJECT.GUARDIAN];

export async function followRoutes(fastify: FastifyInstance) {
  fastify.register(async (routes) => {
    routes.addHook("preHandler", authenticate);

    routes.post("/", { preHandler: [requireRole(...ALL_USERS)] }, followUserController);
    routes.delete("/:id", { preHandler: [requireRole(...ALL_USERS)] }, unfollowUserController);
    routes.get("/:id/status", { preHandler: [requireRole(...ALL_USERS)] }, checkFollowStatusController);
    routes.get("/:id/followers", { preHandler: [requireRole(...ALL_USERS)] }, getFollowersController);
    routes.get("/:id/following", { preHandler: [requireRole(...ALL_USERS)] }, getFollowingController);
  });
}
