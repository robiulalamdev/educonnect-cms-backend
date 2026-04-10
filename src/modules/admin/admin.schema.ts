import { z } from "zod";
import { ADMIN_TYPES } from "./admin.types.js";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ADMIN_TYPES.ROLES).default(ADMIN_TYPES.ROLE_OBJECT.MODERATOR),
  isActive: z.boolean().optional(),
  avatarUrl: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Admin can update own profile or another admin's info (not role/password here)
export const updateAdminSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
  avatarUrl: z.string().optional(),
  // Only SUPER_ADMIN can change role
  role: z.enum(ADMIN_TYPES.ROLES).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const adminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(ADMIN_TYPES.ROLES).optional(),
  isActive: z.coerce.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AdminQueryInput = z.infer<typeof adminQuerySchema>;
