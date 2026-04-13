import { FastifyInstance } from "fastify";
import { 
  createPostController, 
  getPostFeedController, 
  getPostByIdController, 
  updatePostController, 
  getMyPostsController, 
  getAdminPostsController, 
  getPostsDropdownController 
} from "./post.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";

export async function postRoutes(fastify: FastifyInstance) {
  // ── Root / Public ──────────────────────────────────────────
  fastify.get("/", getPostFeedController);
  fastify.get("/:id", getPostByIdController);
  fastify.get("/dropdown/root", getPostsDropdownController);

  // ── Profile / Own Data ─────────────────────────────────────
  fastify.register(async (profileRoutes) => {
    profileRoutes.addHook("preHandler", authenticate);

    // Common for all authenticated users to manage their own posts
    profileRoutes.post("/", createPostController);
    profileRoutes.get("/", getMyPostsController);
    profileRoutes.patch("/:id", updatePostController);
    profileRoutes.get("/dropdown", getPostsDropdownController);

    // Specific role-based aliasing for frontend as requested
    profileRoutes.get("/student/posts", { preHandler: [requireRole("STUDENT")] }, getMyPostsController);
    profileRoutes.get("/teacher/posts", { preHandler: [requireRole("TEACHER")] }, getMyPostsController);
    profileRoutes.get("/guardian/posts", { preHandler: [requireRole("GUARDIAN")] }, getMyPostsController);
  }, { prefix: "/profile" });

  // ── Dashboard / Admin ──────────────────────────────────────
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook("preHandler", authenticate);
    adminRoutes.addHook("preHandler", requireRole("SUPER_ADMIN", "ADMIN", "MODERATOR"));

    adminRoutes.get("/posts", getAdminPostsController);
    adminRoutes.get("/dropdown", getPostsDropdownController);
  }, { prefix: "/dashboard" });
}
