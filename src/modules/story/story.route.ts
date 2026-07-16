import { FastifyInstance } from "fastify";
import {
  createStoryController,
  getStoriesFeedController,
  getUserStoriesController,
  viewStoryController,
  getStoryViewersController,
  deleteStoryController,
} from "./story.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

export async function storyRoutes(fastify: FastifyInstance) {
  fastify.post("/", { preHandler: [authenticate] }, createStoryController);
  fastify.get("/", { preHandler: [authenticate] }, getStoriesFeedController);
  fastify.get("/user/:userId", getUserStoriesController);
  fastify.post("/:storyId/view", { preHandler: [authenticate] }, viewStoryController);
  fastify.get("/:storyId/viewers", { preHandler: [authenticate] }, getStoryViewersController);
  fastify.delete("/:storyId", { preHandler: [authenticate] }, deleteStoryController);
}
