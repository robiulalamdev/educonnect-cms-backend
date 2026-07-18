import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";

export async function setupRateLimit(app: FastifyInstance) {
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      success: false,
      message: "Too many requests, please try again later",
    }),
  });
}
