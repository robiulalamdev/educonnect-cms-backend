import { z } from "zod";
import { USER_TYPES } from "./auth.types.js";

// ── Register ───────────────────────────────────────────────

export const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(USER_TYPES.ROLES),
  phone: z.string().optional(),
  gender: z.enum(USER_TYPES.GENDERS).optional(),
});

// ── Login ──────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ── Email Verification ─────────────────────────────────────

export const verifyEmailSchema = z.object({
  email: z.string().email("Valid email is required"),
  token: z.string().min(1, "Verification token is required"),
});

// ── Resend Verification Email ──────────────────────────────

export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// ── Forgot Password ────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// ── Reset Password ─────────────────────────────────────────

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    new_password: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

// ── Change Password (authenticated) ───────────────────────

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z
    .string()
    .min(8, "New password must be at least 8 characters"),
});

// ── Update Own Profile ─────────────────────────────────────

export const updateProfileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().optional(),
  gender: z.enum(USER_TYPES.GENDERS).optional(),
  date_of_birth: z.string().datetime({ offset: true }).optional(),
  bio: z.string().max(500, "Bio max 500 characters").optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  address_line: z.string().optional(),
});

// ── Types ──────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
