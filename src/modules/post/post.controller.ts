import { FastifyRequest, FastifyReply } from "fastify";
import { 
  createPostSchema, 
  updatePostSchema, 
  postQuerySchema 
} from "./post.schema.js";
import { 
  createPost, 
  getPostList, 
  getPostById, 
  updatePost, 
  getPostsDropdown 
} from "./post.service.js";
import { dropdownQuerySchema } from "../education/education.schema.js";
import { POST_TYPES } from "./post.types.js";

export async function createPostController(req: FastifyRequest, reply: FastifyReply) {
  const authorId = req.user!.userId;
  const input = createPostSchema.parse(req.body);
  const data = await createPost(authorId, input);
  return reply.send({ success: true, message: "Post created successfully", data });
}

export async function getPostFeedController(req: FastifyRequest, reply: FastifyReply) {
  const query = postQuerySchema.parse(req.query);
  const data = await getPostList({ ...query, status: POST_TYPES.STATUS_OBJECT.ACTIVE });
  return reply.send({ success: true, ...data });
}

export async function getMyPostsController(req: FastifyRequest, reply: FastifyReply) {
  const authorId = req.user!.userId;
  const query = postQuerySchema.parse(req.query);
  const data = await getPostList({ ...query, author_id: authorId });
  return reply.send({ success: true, ...data });
}

export async function getAdminPostsController(req: FastifyRequest, reply: FastifyReply) {
  const query = postQuerySchema.parse(req.query);
  const data = await getPostList(query);
  return reply.send({ success: true, ...data });
}

export async function getPostByIdController(req: FastifyRequest, reply: FastifyReply) {
  const { slug } = req.params as { slug: string };
  // Find by slug for public detail
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { id: true }
  });
  if (!post) return reply.status(404).send({ success: false, message: "Post not found" });
  
  const data = await getPostById(post.id);
  return reply.send({ success: true, data });
}

export async function updatePostController(req: FastifyRequest, reply: FastifyReply) {
  const authorId = req.user!.userId;
  const { id } = req.params as { id: string };
  const input = updatePostSchema.parse(req.body);
  const data = await updatePost(id, authorId, input);
  return reply.send({ success: true, message: "Post updated successfully", data });
}

export async function getPostsDropdownController(req: FastifyRequest, reply: FastifyReply) {
  const query = dropdownQuerySchema.parse(req.query);
  
  const context = {
    author_id: req.user?.userId
  };

  const data = await getPostsDropdown(query, context);
  return reply.send({ success: true, ...data });
}
