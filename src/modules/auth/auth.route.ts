import { FastifyInstance } from "fastify";
import { verifyUserToken } from "./auth.middleware.js";
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  verifyEmailController,
  resendVerificationController,
  forgotPasswordController,
  resetPasswordController,
  getMeController,
  updateMeController,
  changePasswordController,
} from "./auth.controller.js";

export async function authRoutes(fastify: FastifyInstance) {
  // ── Public — no auth required ──────────────────────────

  // POST /api/v1/auth/register
  fastify.post("/register", registerController);

  // POST /api/v1/auth/login
  fastify.post("/login", loginController);

  // POST /api/v1/auth/refresh
  fastify.post("/refresh", refreshController);

  // POST /api/v1/auth/verify-email
  fastify.post("/verify-email", verifyEmailController);

  // POST /api/v1/auth/resend-verification
  fastify.post("/resend-verification", resendVerificationController);

  // POST /api/v1/auth/forgot-password
  fastify.post("/forgot-password", forgotPasswordController);

  // POST /api/v1/auth/reset-password
  fastify.post("/reset-password", resetPasswordController);

  // ── Protected — require valid user token ───────────────

  // POST /api/v1/auth/logout            🔒 verifyUserToken
  fastify.post(
    "/logout",
    { preHandler: [verifyUserToken] },
    logoutController,
  );

  // GET  /api/v1/auth/me                🔒 verifyUserToken
  fastify.get(
    "/me",
    { preHandler: [verifyUserToken] },
    getMeController,
  );

  // PATCH /api/v1/auth/me               🔒 verifyUserToken  (multipart: avatar 1 file optional)
  fastify.patch(
    "/me",
    { preHandler: [verifyUserToken] },
    updateMeController,
  );

  // PATCH /api/v1/auth/me/password      🔒 verifyUserToken
  fastify.patch(
    "/me/password",
    { preHandler: [verifyUserToken] },
    changePasswordController,
  );
}
