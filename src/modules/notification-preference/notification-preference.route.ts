import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import {
  getPreferencesController,
  updatePreferencesController,
} from "./notification-preference.controller.js";

export async function notificationPreferenceRoutes(fastify: FastifyInstance) {
  fastify.register(async (routes) => {
    routes.addHook("preHandler", authenticate);
    routes.addHook("preHandler", requireRole(USER_TYPES.ROLE_OBJECT.TEACHER, USER_TYPES.ROLE_OBJECT.STUDENT, USER_TYPES.ROLE_OBJECT.GUARDIAN));

    routes.get("/", getPreferencesController);
    routes.patch("/", updatePreferencesController);
  });
}
