import fp from "fastify-plugin";
import cors, { type FastifyCorsOptions } from "@fastify/cors";
import { env } from "../config/env.js";

export default fp<FastifyCorsOptions>(async (fastify) => {
  const origins = env.CORS_ORIGINS?.split(",") || [];

  fastify.register(cors, {
    origin: origins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  });
});
