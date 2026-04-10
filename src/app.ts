import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";

// Plugins
import corsPlugin from "./plugins/cors.js";

// Routes
import { userRoutes } from "./modules/user/user.route";
import { authRoutes } from "./modules/auth/auth.route";
import { adminRoutes } from "./modules/admin/admin.route";
import { env } from "./config/env";

export function buildApp() {
  const app = Fastify({
    logger: false,
  });

  // Security Headers
  app.register(helmet);

  // Register Custom Plugins
  app.register(corsPlugin);

  // Cookie plugin — required for setCookie / request.cookies
  app.register(cookie, {
    secret: env.COOKIE_ACCESS_SECRET,
    parseOptions: {},
  });

  // Multipart for file uploads — 10MB limit
  app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1,
    },
  });

  // Initialize route
  app.get("/", async (request, reply) => {
    return {
      message: "Welcome to the server",
      status: "success",
      timestamp: new Date().toISOString(), // Standard: 2026-03-15T10:35:00.000Z
      localTime: new Date().toLocaleString(), // Human-readable based on server time
    };
  });

  app.register(adminRoutes, { prefix: "/api/v1/admin" });
  app.register(authRoutes, { prefix: "/api/v1/auth" });
  app.register(userRoutes, { prefix: "/api/v1/user" });

  return app;
}
