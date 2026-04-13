// ============================================================
// MODULE: guardian.types.ts
// Guardian-Student link status constants
// ============================================================

export const GUARDIAN_STUDENT_STATUS_OBJECT = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  REMOVED: "REMOVED",
} as const;

export const GUARDIAN_TYPES = {
  STATUSES: ["PENDING", "ACTIVE", "REMOVED"] as const,
  STATUS_OBJECT: GUARDIAN_STUDENT_STATUS_OBJECT,
} as const;

// ── Exported Types ─────────────────────────────────────────

export type IGuardianStudentStatus = (typeof GUARDIAN_STUDENT_STATUS_OBJECT)[keyof typeof GUARDIAN_STUDENT_STATUS_OBJECT];
