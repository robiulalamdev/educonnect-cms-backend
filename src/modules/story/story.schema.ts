import { z } from "zod";

export const createStorySchema = z.object({
  content: z.string().max(500).optional(),
  bg_color: z.string().optional(),
  media_type: z.enum(["IMAGE", "VIDEO"]).optional(),
});

export const storyQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type StoryQueryInput = z.infer<typeof storyQuerySchema>;
