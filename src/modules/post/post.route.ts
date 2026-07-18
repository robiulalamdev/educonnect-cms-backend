import { FastifyInstance } from "fastify";
import {
  createPostController,
  getPostFeedController,
  getPostByIdController,
  updatePostController,
  getMyPostsController,
  getPostsDropdownController,
  getAdminPostsController,
  getTrendingPostsController,
} from "./post.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import { ADMIN_TYPES } from "../admin/admin.types.js";

const ALL_USERS = [USER_TYPES.ROLE_OBJECT.TEACHER, USER_TYPES.ROLE_OBJECT.STUDENT, USER_TYPES.ROLE_OBJECT.GUARDIAN];

export async function postRoutes(fastify: FastifyInstance) {
  // ── Root / Public ──────────────────────────────────────────
  fastify.get("/", getPostFeedController);
  fastify.get("/trending", getTrendingPostsController);
  fastify.get("/:id", getPostByIdController);
  fastify.get("/dropdown/root", getPostsDropdownController);

  // ── Profile / Own Data ─────────────────────────────────────
  fastify.register(async (profileRoutes) => {
    profileRoutes.addHook("preHandler", authenticate);

    profileRoutes.post("/", { preHandler: [requireRole(...ALL_USERS)] }, createPostController);
    profileRoutes.get("/", { preHandler: [requireRole(...ALL_USERS)] }, getMyPostsController);
    profileRoutes.patch("/:id", { preHandler: [requireRole(...ALL_USERS)] }, updatePostController);
    profileRoutes.get("/dropdown", { preHandler: [requireRole(...ALL_USERS)] }, getPostsDropdownController);

    // Role-specific endpoints
    profileRoutes.get("/student/posts", { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.STUDENT)] }, getMyPostsController);
    profileRoutes.get("/teacher/posts", { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] }, getMyPostsController);
    profileRoutes.get("/guardian/posts", { preHandler: [requireRole(USER_TYPES.ROLE_OBJECT.GUARDIAN)] }, getMyPostsController);
  }, { prefix: "/profile" });

  // ── Dashboard / Admin ──────────────────────────────────────
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook("preHandler", authenticate);
    adminRoutes.addHook("preHandler", requireRole(...ADMIN_TYPES.PERMISSIONS.CAN_MODERATE_POST));

    adminRoutes.get("/posts", getAdminPostsController);
    adminRoutes.get("/dropdown", getPostsDropdownController);
  }, { prefix: "/dashboard" });
}
