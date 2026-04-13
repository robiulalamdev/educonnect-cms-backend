import { z } from "zod";

export const educationQuerySchema = z.object({
  group_id: z.string().optional(),
  is_active: z.coerce.boolean().optional().default(true),
});

export const subjectQuerySchema = z.object({
  category_id: z.string().optional(),
  is_active: z.coerce.boolean().optional().default(true),
});

export const dropdownQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  is_active: z.coerce.boolean().optional().default(true),
});

export type EducationQueryInput = z.infer<typeof educationQuerySchema>;
export type SubjectQueryInput = z.infer<typeof subjectQuerySchema>;
export type DropdownQueryInput = z.infer<typeof dropdownQuerySchema>;
