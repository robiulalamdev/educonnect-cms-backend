import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import {
  registerDeviceController,
  removeDeviceController,
  removeDeviceByIdController,
  getDevicesController,
  deactivateAllDevicesController,
} from "./device.controller.js";

const ALL_USERS = [USER_TYPES.ROLE_OBJECT.TEACHER, USER_TYPES.ROLE_OBJECT.STUDENT, USER_TYPES.ROLE_OBJECT.GUARDIAN];

export async function deviceRoutes(fastify: FastifyInstance) {
  fastify.register(async (routes) => {
    routes.addHook("preHandler", authenticate);
    routes.addHook("preHandler", requireRole(...ALL_USERS));

    // Register device token (web or mobile)
    routes.post("/register", registerDeviceController);
    // List all registered devices
    routes.get("/", getDevicesController);
    // Remove device by FCM token
    routes.delete("/:fcm_token", removeDeviceController);
    // Remove device by ID
    routes.delete("/id/:id", removeDeviceByIdController);
    // Deactivate all devices (logout everywhere)
    routes.post("/deactivate-all", deactivateAllDevicesController);
  });
}
