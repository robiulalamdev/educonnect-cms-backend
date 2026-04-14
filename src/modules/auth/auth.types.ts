// ============================================================
// MODULE: auth.types.ts
// User roles, status, gender constants
// ============================================================

// ── Role Object ────────────────────────────────────────────

export const USER_ROLE_OBJECT = {
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  GUARDIAN: "GUARDIAN",
} as const;

// ── Status Object ──────────────────────────────────────────

export const USER_STATUS_OBJECT = {
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  BANNED: "BANNED",
} as const;

// ── Gender Object ──────────────────────────────────────────

export const GENDER_OBJECT = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
} as const;

// ── Main Types Object ──────────────────────────────────────

export const USER_TYPES = {
  ROLES: ["TEACHER", "STUDENT", "GUARDIAN"] as const,
  STATUS: ["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "BANNED"] as const,
  GENDERS: ["MALE", "FEMALE", "OTHER"] as const,

  ROLE_OBJECT: USER_ROLE_OBJECT,
  STATUS_OBJECT: USER_STATUS_OBJECT,
  GENDER_OBJECT: GENDER_OBJECT,
} as const;

// ── Exported Types ─────────────────────────────────────────

export type IUserRole = (typeof USER_ROLE_OBJECT)[keyof typeof USER_ROLE_OBJECT];
export type IUserStatus = (typeof USER_TYPES.STATUS)[number];
export type IGender = (typeof USER_TYPES.GENDERS)[number];
