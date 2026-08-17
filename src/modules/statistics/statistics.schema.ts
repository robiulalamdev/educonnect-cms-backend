import { z } from "zod";

export const statsQuerySchema = z.object({
  period: z.enum(["week", "month", "quarter", "year"]).optional().default("month"),
});

export type StatsQueryInput = z.infer<typeof statsQuerySchema>;
