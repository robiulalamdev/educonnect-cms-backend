import { z } from "zod";
import { ADMIN_TYPES } from "./admin.types.js";

// ── Auth ───────────────────────────────────────────────────

export const registerAdminSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(ADMIN_TYPES.ROLES).default(ADMIN_TYPES.ROLE_OBJECT.MODERATOR),
});

export const loginAdminSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "New password must be at least 8 characters"),
});

// ── Profile Update ─────────────────────────────────────────

export const updateOwnProfileSchema = z.object({
  full_name: z.string().min(2).optional(),
  // email: z.string().email().optional(),
});

// ── Admin Management ───────────────────────────────────────

export const updateAdminSchema = z.object({
  full_name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(ADMIN_TYPES.ROLES).optional(), // only SUPER_ADMIN can use this
  status: z.enum(ADMIN_TYPES.STATUS).optional(),
});

export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(ADMIN_TYPES.ROLES).optional(),
  status: z.enum(ADMIN_TYPES.STATUS).optional(),
});

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  admin_id: z.string().optional(),
  action: z.enum(ADMIN_TYPES.AUDIT_ACTIONS).optional(),
  target_type: z.string().optional(),
  target_id: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

export const moderationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(["posts", "reviews", "all"]).default("all"),
  search: z.string().optional(),
});

// ── Types ──────────────────────────────────────────────────

export type RegisterAdminInput = z.infer<typeof registerAdminSchema>;
export type LoginAdminInput = z.infer<typeof loginAdminSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
export type AdminListQueryInput = z.infer<typeof adminListQuerySchema>;
export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
export type ModerationQueryInput = z.infer<typeof moderationQuerySchema>;
