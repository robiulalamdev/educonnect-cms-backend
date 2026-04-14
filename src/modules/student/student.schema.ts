import { z } from "zod";

export const updateStudentProfileSchema = z.object({
  education_level_id: z.string().optional(),
  institution_name: z.string().optional(),
  roll_number: z.string().optional(),
});

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;
