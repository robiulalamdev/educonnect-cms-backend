import { z } from "zod";
import { TASK_TYPES } from "./task.types.js";

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  class_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  visibility: z.array(z.string()).optional(), // student_profile_ids — empty = all enrolled
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  class_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status: z.nativeEnum(TASK_TYPES.STATUS_OBJECT).optional(),
});

export const taskQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  batch_id: z.string().optional(),
  status: z.nativeEnum(TASK_TYPES.STATUS_OBJECT).optional(),
  search: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
