import { buildApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const app = buildApp();

const start = async () => {
  try {
    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

// ✅ graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");

  try {
    await app.close(); // Fastify close
    await prisma.$disconnect();

    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown", err);
    process.exit(1);
  }
});
