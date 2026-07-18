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

  // Health check
  app.get("/", async () => {
    return {
      message: "Welcome to the server",
      status: "success",
      timestamp: new Date().toISOString(),
      localTime: new Date().toLocaleString(),
    };
  });

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
