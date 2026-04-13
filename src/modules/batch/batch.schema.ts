import { z } from "zod";
import { BATCH_TYPES } from "./batch.types.js";

export const batchScheduleSchema = z.object({
  day: z.nativeEnum(BATCH_TYPES.DAY_OBJECT),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
});

export const createBatchSchema = z.object({
  service_id: z.string(),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  max_students: z.number().min(1),
  waitlist_enabled: z.boolean().optional().default(false),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  schedule: z.array(batchScheduleSchema).min(1),
});

export const updateBatchSchema = createBatchSchema.partial().extend({
  status: z.nativeEnum(BATCH_TYPES.STATUS_OBJECT).optional(),
});

export const batchQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  service_id: z.string().optional(),
  teacher_id: z.string().optional(),
  status: z.nativeEnum(BATCH_TYPES.STATUS_OBJECT).optional(),
  search: z.string().optional(),
});

export const dropdownQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  is_active: z.coerce.boolean().optional().default(true),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
export type BatchQueryInput = z.infer<typeof batchQuerySchema>;
export type DropdownQueryInput = z.infer<typeof dropdownQuerySchema>;
