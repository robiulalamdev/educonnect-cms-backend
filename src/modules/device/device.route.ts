import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import {
  registerDeviceController,
  removeDeviceController,
  getDevicesController,
  deactivateAllDevicesController,
} from "./device.controller.js";

export async function deviceRoutes(fastify: FastifyInstance) {
  fastify.register(async (routes) => {
    routes.addHook("preHandler", authenticate);
    routes.addHook("preHandler", requireRole(USER_TYPES.ROLE_OBJECT.TEACHER, USER_TYPES.ROLE_OBJECT.STUDENT, USER_TYPES.ROLE_OBJECT.GUARDIAN));

    routes.post("/register", registerDeviceController);
    routes.get("/", getDevicesController);
    routes.delete("/:fcm_token", removeDeviceController);
    routes.post("/deactivate-all", deactivateAllDevicesController);
  });
}
