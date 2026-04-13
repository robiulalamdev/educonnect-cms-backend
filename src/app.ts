import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import fastifySocketIo from "fastify-socket.io";
import { socketManager } from "./config/socket.js";

// Plugins
import corsPlugin from "./plugins/cors.js";

// Routes
import { userRoutes } from "./modules/user/user.route.js";
import { teacherRoutes } from "./modules/teacher/teacher.route.js";
import { studentRoutes } from "./modules/student/student.route.js";
import { guardianRoutes } from "./modules/guardian/guardian.route.js";
import { educationRoutes } from "./modules/education/education.route.js";
import { subscriptionRoutes } from "./modules/subscription/subscription.route.js";
import { authRoutes } from "./modules/auth/auth.route.js";
import { adminRoutes } from "./modules/admin/admin.route.js";
import { serviceRoutes } from "./modules/service/service.route.js";
import { batchRoutes } from "./modules/batch/batch.route.js";
import { enrollmentRoutes } from "./modules/enrollment/enrollment.route.js";
import { postRoutes } from "./modules/post/post.route.js";
import { chatRoutes } from "./modules/chat/chat.route.js";
import { statisticsRoutes } from "./modules/statistics/statistics.route.js";
import { env } from "./config/env.js";

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
    secret: env.COOKIE_SECRET,
    hook: "onRequest",
  });

  // Multipart for file uploads — 10MB limit
  app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1,
    },
  });

  // Socket.io Integration
  app.register(fastifySocketIo, {
    cors: {
      origin: [env.FRONTEND_URL, env.ADMIN_FRONTEND_URL],
      credentials: true,
    },
  });

  // Initialize SocketManager once server is ready
  app.addHook("onReady", async () => {
    socketManager.initialize(app);
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

  // --- Module Registration ---
  app.register(adminRoutes, { prefix: "/api/v1/admin" });
  app.register(authRoutes, { prefix: "/api/v1/auth" });
  app.register(userRoutes, { prefix: "/api/v1/user" });
  app.register(teacherRoutes, { prefix: "/api/v1/teacher" });
  app.register(studentRoutes, { prefix: "/api/v1/student" });
  app.register(guardianRoutes, { prefix: "/api/v1/guardian" });
  app.register(educationRoutes, { prefix: "/api/v1/education" });
  app.register(subscriptionRoutes, { prefix: "/api/v1/subscription" });
  
  // New Modules
  app.register(serviceRoutes, { prefix: "/api/v1/services" });
  app.register(batchRoutes, { prefix: "/api/v1/batches" });
  app.register(enrollmentRoutes, { prefix: "/api/v1/enrollments" });
  app.register(postRoutes, { prefix: "/api/v1/posts" });
  app.register(chatRoutes, { prefix: "/api/v1/chats" });
  app.register(statisticsRoutes, { prefix: "/api/v1/statistics" });

  return app;
}