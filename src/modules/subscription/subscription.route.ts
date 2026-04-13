import { FastifyInstance } from "fastify";
import { verifyUserToken } from "../auth/auth.middleware.js";
import {
  getPackagesController,
  getMySubscriptionController,
  subscribeController,
} from "./subscription.controller.js";

export async function subscriptionRoutes(fastify: FastifyInstance) {
  // Public route to see prices/packages
  fastify.get("/packages", getPackagesController);

  // Authenticated routes
  fastify.get(
    "/me",
    { preHandler: [verifyUserToken] },
    getMySubscriptionController,
  );

  fastify.post(
    "/subscribe",
    { preHandler: [verifyUserToken] },
    subscribeController,
  );
}
