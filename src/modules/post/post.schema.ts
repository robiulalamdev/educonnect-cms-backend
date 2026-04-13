import { z } from "zod";
import { POST_TYPES } from "./post.types.js";

export const createPostSchema = z.object({
  type: z.nativeEnum(POST_TYPES.TYPE_OBJECT),
  title: z.string().min(3).max(255),
  content: z.string().min(10).max(5000),
  media_ids: z.array(z.string()).optional(),
  service_id: z.string().optional(), // If OFFERING, can link to a service
  level_id: z.string().optional(),
  subject_id: z.string().optional(),
});

export const updatePostSchema = createPostSchema.partial().extend({
  status: z.nativeEnum(POST_TYPES.STATUS_OBJECT).optional(),
});

export const postQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  type: z.nativeEnum(POST_TYPES.TYPE_OBJECT).optional(),
  status: z.nativeEnum(POST_TYPES.STATUS_OBJECT).optional(),
  author_id: z.string().optional(),
  subject_id: z.string().optional(),
  level_id: z.string().optional(),
  search: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostQueryInput = z.infer<typeof postQuerySchema>;
