import { buildApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { expireSubscriptions } from "./modules/subscription/subscription.service.js";

const start = async () => {
  try {
    const app = await buildApp();

    // Expire stale subscriptions on startup
    await expireSubscriptions().catch((err) => {
      console.error("[Startup] Failed to expire subscriptions:", err);
    });

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    });

    // graceful shutdown
    process.on("SIGTERM", async () => {
      console.log("SIGTERM received, shutting down gracefully...");
      try {
        await app.close();
        await prisma.$disconnect();
        process.exit(0);
      } catch (err) {
        console.error("Error during shutdown", err);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
