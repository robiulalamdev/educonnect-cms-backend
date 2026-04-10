import Fastify from "fastify";
import helmet from "@fastify/helmet";
import path from "path";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";

import corsPlugin from "./plugins/cors.js";

import { userRoutes } from "./modules/user/user.route";
import { authRoutes } from "./modules/auth/auth.route";
import { adminRoutes } from "./modules/admin/admin.route";
import { brandRoutes } from "./modules/brand/brand.route.js";
import { categoryRoutes } from "./modules/category/category.route.js";
import { seriesRoutes } from "./modules/series/series.route.js";
import { deviceRoutes } from "./modules/device/device.route.js";
import { specGroupRoutes } from "./modules/spec-group/spec-group.route.js";
import { env } from "./config/env";

export function buildApp() {
  const app = Fastify({
    logger: false,
    // {
    //   transport: {
    //     targets: [
    //       // 1. Terminal
    //       {
    //         target: "pino-pretty",
    //         options: {
    //           colorize: true,
    //           translateTime: "yyyy-MM-dd HH:mm:ss",
    //           messageFormat:
    //             "{msg} [ {req.method} {req.url} ] {res.statusCode} - {responseTime}ms",
    //           ignore: "pid,hostname,req,res,reqId,responseTime",
    //           singleLine: true,
    //         },
    //       },
    //       // 2. Custom Daily File Transport
    //       // {
    //       //   // Point this to the actual JS/TS file we created in step 1
    //       //   target: path.join(__dirname, "utils/logger.ts"),
    //       //   options: {
    //       //     // Any extra options you want to pass to pino-roll
    //       //   },
    //       // },
    //       ...(isProd
    //         ? [
    //             {
    //               target: path.join(__dirname, "utils/logger.js"),
    //               options: {},
    //             },
    //           ]
    //         : []),
    //     ],
    //   },
    // },
  });

  // Security Headers
  app.register(helmet);

  // Register Custom Plugins
  app.register(corsPlugin);
  // app.register(rateLimitPlugin);
  // app.register(jwtPlugin);

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

  app.register(adminRoutes, { prefix: "/api/v1" });
  app.register(authRoutes, { prefix: "/api/v1/auth" });
  app.register(userRoutes, { prefix: "/api/v1" });

  app.register(brandRoutes, { prefix: "/api/v1" });
  app.register(categoryRoutes, { prefix: "/api/v1" });
  app.register(seriesRoutes, { prefix: "/api/v1" });
  app.register(deviceRoutes, { prefix: "/api/v1" });
  app.register(specGroupRoutes, { prefix: "/api/v1" });

  return app;
}
