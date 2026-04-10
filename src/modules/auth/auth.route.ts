import type { FastifyInstance } from "fastify";
import { authController } from "./auth.controller";

export async function authRoutes(app: FastifyInstance) {
  app.get("/auth", authController.getAuthController);
}
