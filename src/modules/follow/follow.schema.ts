import { z } from "zod";

export const followUserSchema = z.object({
  following_id: z.string().min(1),
});

export const followQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
});

export type FollowUserInput = z.infer<typeof followUserSchema>;
export type FollowQueryInput = z.infer<typeof followQuerySchema>;
