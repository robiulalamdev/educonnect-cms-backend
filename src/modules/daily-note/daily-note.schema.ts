import { z } from "zod";

export const createDailyNoteSchema = z.object({
  note_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(5000),
  next_day_plan: z.string().max(2000).optional(),
});

export const updateDailyNoteSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(5000).optional(),
  next_day_plan: z.string().max(2000).optional(),
});

export const dailyNoteQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  batch_id: z.string().optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().optional(),
});

export type CreateDailyNoteInput = z.infer<typeof createDailyNoteSchema>;
export type UpdateDailyNoteInput = z.infer<typeof updateDailyNoteSchema>;
export type DailyNoteQueryInput = z.infer<typeof dailyNoteQuerySchema>;
