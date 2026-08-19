import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import { socketManager } from "./config/socket.js";

// Plugins
import corsPlugin from "./plugins/cors.js";
import { setupRateLimit } from "./plugins/rateLimit.js";

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
import { commentRoutes } from "./modules/comment/comment.route.js";
import { likeRoutes } from "./modules/like/like.route.js";
import { storyRoutes } from "./modules/story/story.route.js";
import { chatRoutes } from "./modules/chat/chat.route.js";
import { statisticsRoutes } from "./modules/statistics/statistics.route.js";

// New Modules
import { notificationRoutes } from "./modules/notification/notification.route.js";
import { blockRoutes } from "./modules/block/block.route.js";
import { attendanceRoutes } from "./modules/attendance/attendance.route.js";
import { taskRoutes } from "./modules/task/task.route.js";
import { dailyNoteRoutes } from "./modules/daily-note/daily-note.route.js";
import { announcementRoutes } from "./modules/announcement/announcement.route.js";
import { reviewRoutes } from "./modules/review/review.route.js";
import { followRoutes } from "./modules/follow/follow.route.js";
import { deviceRoutes } from "./modules/device/device.route.js";
import { notificationPreferenceRoutes } from "./modules/notification-preference/notification-preference.route.js";
import { paymentRoutes } from "./modules/payment/payment.route.js";

import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { setupSwagger } from "./plugins/swagger.js";
import { log } from "./utils/logger.js";

export async function buildApp() {
  const app = Fastify({
    logger: false,
    genReqId: (req) => req.headers['x-request-id'] as string ?? crypto.randomUUID(),
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

  // Multipart for file uploads — 10MB limit, up to 5 files
  // (chat attachments allow up to 3 media files per message)
  app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5,
    },
  });

  // Socket.io Integration
  // Note: we wire socket.io directly onto Fastify's HTTP server (app.server)
  // instead of using fastify-socket.io, because fastify-socket.io@5.1.0 only
  // supports Fastify 4 and crashes ("stream.write is not a function") on
  // Fastify 5 when broadcasting to connected clients.
  app.decorate("io", null);

  // Initialize SocketManager once server is ready
  app.addHook("onReady", async () => {
    const { Server } = await import("socket.io");
    const { env } = await import("./config/env.js");
    app.io = new Server(app.server, {
      cors: {
        origin: [env.FRONTEND_URL, env.ADMIN_FRONTEND_URL],
        credentials: true,
      },
    });
    socketManager.initialize(app);
  });

  // ── Request Logging ──────────────────────────────────────────
  app.addHook("onRequest", async (request) => {
    request.startTime = process.hrtime.bigint();
  });

  app.addHook("onResponse", async (request, reply) => {
    const startTime = request.startTime as bigint | undefined;
    const responseTime = startTime 
      ? Number(process.hrtime.bigint() - startTime) / 1_000_000 
      : 0;
    
    log.request(request, reply, responseTime);
  });

  // ── Global Error Handler ─────────────────────────────────────
  app.setErrorHandler(async (error, request, reply) => {
    const statusCode = error.statusCode ?? 500;
    
    log.error('Unhandled error', {
      err: error,
      reqId: request.id,
      method: request.method,
      url: request.url,
      userId: request.user?.id,
      userRole: request.user?.role,
    });

    // Don't leak internal error details in production
    const isProduction = env.NODE_ENV === 'production';
    
    if (statusCode >= 500 && isProduction) {
      return reply.code(500).send({
        success: false,
        message: 'Internal server error',
        error: env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    return reply.code(statusCode).send({
      success: false,
      message: error.message ?? 'Internal server error',
      errors: error.validation?.map((v) => ({
        field: v.instancePath.replace('/', ''),
        message: v.message,
      })),
    });
  });

  // ── Swagger/OpenAPI Documentation ──────────────────────────
  await setupSwagger(app);

  // ── Health Check Endpoints ─────────────────────────────────
  // Liveness probe - returns 200 if process is alive
  app.get("/health", async () => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version ?? "1.0.0",
    };
  });

  // Readiness probe - returns 200 if DB and Redis are connected
  app.get("/ready", async (request, reply) => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      
      return {
        status: "ready",
        timestamp: new Date().toISOString(),
        checks: {
          database: "connected",
          redis: "connected",
        },
      };
    } catch (error) {
      reply.code(503);
      return {
        status: "not ready",
        timestamp: new Date().toISOString(),
        checks: {
          database: "disconnected",
          redis: "unknown",
        },
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Root endpoint
  app.get("/", async () => {
    return {
      message: "Welcome to the EduConnect API",
      status: "success",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "1.0.0",
      docs: "/docs",
    };
  });

  // Rate Limiting
  await setupRateLimit(app);

  // ── Module Registration ──────────────────────────────────
  app.register(adminRoutes, { prefix: "/api/v1/admin" });
  app.register(authRoutes, { prefix: "/api/v1/auth" });
  app.register(userRoutes, { prefix: "/api/v1/user" });
  app.register(teacherRoutes, { prefix: "/api/v1/teacher" });
  app.register(studentRoutes, { prefix: "/api/v1/student" });
  app.register(guardianRoutes, { prefix: "/api/v1/guardian" });
  app.register(educationRoutes, { prefix: "/api/v1/education" });
  app.register(subscriptionRoutes, { prefix: "/api/v1/subscription" });
  app.register(serviceRoutes, { prefix: "/api/v1/services" });
  app.register(batchRoutes, { prefix: "/api/v1/batches" });
  app.register(enrollmentRoutes, { prefix: "/api/v1/enrollments" });
  app.register(postRoutes, { prefix: "/api/v1/posts" });
  app.register(commentRoutes, { prefix: "/api/v1/posts" });
  app.register(likeRoutes, { prefix: "/api/v1/posts" });
  app.register(storyRoutes, { prefix: "/api/v1/stories" });
  app.register(chatRoutes, { prefix: "/api/v1/chats" });
  app.register(statisticsRoutes, { prefix: "/api/v1/statistics" });

  // New Modules
  app.register(notificationRoutes, { prefix: "/api/v1/notifications" });
  app.register(blockRoutes, { prefix: "/api/v1/blocks" });
  app.register(attendanceRoutes, { prefix: "/api/v1/attendance" });
  app.register(taskRoutes, { prefix: "/api/v1/tasks" });
  app.register(dailyNoteRoutes, { prefix: "/api/v1/daily-notes" });
  app.register(announcementRoutes, { prefix: "/api/v1/announcements" });
  app.register(reviewRoutes, { prefix: "/api/v1/reviews" });
  app.register(followRoutes, { prefix: "/api/v1/follows" });
  app.register(deviceRoutes, { prefix: "/api/v1/devices" });
  app.register(notificationPreferenceRoutes, { prefix: "/api/v1/notification-preferences" });
  app.register(paymentRoutes, { prefix: "/api/v1/payment" });

  return app;
}
