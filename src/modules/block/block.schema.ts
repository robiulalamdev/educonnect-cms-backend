import { z } from "zod";

export const blockUserSchema = z.object({
  blocked_id: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export const blockQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
});

export type BlockUserInput = z.infer<typeof blockUserSchema>;
export type BlockQueryInput = z.infer<typeof blockQuerySchema>;
