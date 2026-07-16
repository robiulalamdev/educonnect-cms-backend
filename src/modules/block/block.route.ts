import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import {
  blockUserController,
  unblockUserController,
  getBlockedUsersController,
} from "./block.controller.js";

const ALL_USERS = [USER_TYPES.ROLE_OBJECT.TEACHER, USER_TYPES.ROLE_OBJECT.STUDENT, USER_TYPES.ROLE_OBJECT.GUARDIAN];

export async function blockRoutes(fastify: FastifyInstance) {
  fastify.register(async (routes) => {
    routes.addHook("preHandler", authenticate);
    routes.addHook("preHandler", requireRole(...ALL_USERS));

    routes.post("/", blockUserController);
    routes.get("/", getBlockedUsersController);
    routes.delete("/:id", unblockUserController);
  });
}
