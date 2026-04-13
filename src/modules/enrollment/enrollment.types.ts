// ============================================================
// MODULE: enrollment.types.ts
// Enrollment and Payment status/method constants
// ============================================================

export const ENROLLMENT_STATUS_OBJECT = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  WAITLISTED: "WAITLISTED",
  REMOVED: "REMOVED",
  SUSPENDED: "SUSPENDED",
  LEFT: "LEFT",
} as const;

export const PAYMENT_STATUS_OBJECT = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const PAYMENT_METHOD_OBJECT = {
  BKASH: "BKASH",
  NAGAD: "NAGAD",
  ROCKET: "ROCKET",
  BANK_TRANSFER: "BANK_TRANSFER",
  CASH: "CASH",
  OTHER: "OTHER",
} as const;

export const ENROLLMENT_TYPES = {
  ENROLLMENT_STATUSES: ["PENDING", "APPROVED", "REJECTED", "WAITLISTED", "REMOVED", "SUSPENDED", "LEFT"] as const,
  PAYMENT_STATUSES: ["PENDING", "APPROVED", "REJECTED"] as const,
  PAYMENT_METHODS: ["BKASH", "NAGAD", "ROCKET", "BANK_TRANSFER", "CASH", "OTHER"] as const,
  
  ENROLLMENT_STATUS_OBJECT,
  PAYMENT_STATUS_OBJECT,
  PAYMENT_METHOD_OBJECT,
} as const;

// ── Exported Types ─────────────────────────────────────────

export type IEnrollmentStatus = (typeof ENROLLMENT_STATUS_OBJECT)[keyof typeof ENROLLMENT_STATUS_OBJECT];
export type IPaymentStatus = (typeof PAYMENT_STATUS_OBJECT)[keyof typeof PAYMENT_STATUS_OBJECT];
export type IPaymentMethod = (typeof PAYMENT_METHOD_OBJECT)[keyof typeof PAYMENT_METHOD_OBJECT];
