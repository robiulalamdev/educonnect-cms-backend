import { z } from "zod";
import { USER_TYPES } from "./user.types.js";

// -- Profile Updates --

export const updateTeacherProfileSchema = z.object({
  tagline: z.string().max(100, "Tagline max 100 characters").optional(),
  experience_years: z.coerce.number().int().min(0).max(50).optional(),
  qualifications: z.string().optional(),
  achievements: z.string().optional(),
});

export const updateStudentProfileSchema = z.object({
  education_level_id: z.string().optional(),
  institution_name: z.string().optional(),
  roll_number: z.string().optional(),
});

export const updateGuardianProfileSchema = z.object({
  occupation: z.string().optional(),
});

// -- User Listing / Search --

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(USER_TYPES.ROLES).optional(),
  status: z.enum(USER_TYPES.STATUS).optional(),
  city: z.string().optional(),
  area: z.string().optional(),
});

// -- Types --

export type UpdateTeacherProfileInput = z.infer<typeof updateTeacherProfileSchema>;
export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;
export type UpdateGuardianProfileInput = z.infer<typeof updateGuardianProfileSchema>;
export type UserListQueryInput = z.infer<typeof userListQuerySchema>;
