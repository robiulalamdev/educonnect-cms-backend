import { z } from "zod";

export const toggleLikeSchema = z.object({
  post_id: z.string().optional(),
  comment_id: z.string().optional(),
}).refine((data) => data.post_id || data.comment_id, {
  message: "Either post_id or comment_id is required",
});

export type ToggleLikeInput = z.infer<typeof toggleLikeSchema>;
