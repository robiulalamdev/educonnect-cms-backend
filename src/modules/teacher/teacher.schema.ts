import { z } from "zod";

export const updateTeacherProfileSchema = z.object({
  tagline: z.string().max(100, "Tagline max 100 characters").optional(),
  experience_years: z.coerce.number().int().min(0).max(50).optional(),
  qualifications: z.string().optional(),
  achievements: z.string().optional(),
});

export type UpdateTeacherProfileInput = z.infer<typeof updateTeacherProfileSchema>;
