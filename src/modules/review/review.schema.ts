import { z } from "zod";
import { REVIEW_TYPES } from "./review.types.js";

export const createReviewSchema = z.object({
  enrollment_id: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const replyReviewSchema = z.object({
  teacher_reply: z.string().min(1).max(2000),
});

export const reviewQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  service_id: z.string().optional(),
  teacher_id: z.string().optional(),
  status: z.nativeEnum(REVIEW_TYPES.STATUS_OBJECT).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ReplyReviewInput = z.infer<typeof replyReviewSchema>;
export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;
