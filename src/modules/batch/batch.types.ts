// ============================================================
// MODULE: batch.types.ts
// Batch status and days of week constants
// ============================================================

export const DAY_OF_WEEK_OBJECT = {
  SUNDAY: "SUNDAY",
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
} as const;

export const BATCH_STATUS_OBJECT = {
  UPCOMING: "UPCOMING",
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const BATCH_TYPES = {
  DAYS: ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const,
  STATUS: ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"] as const,
  
  DAY_OBJECT: DAY_OF_WEEK_OBJECT,
  STATUS_OBJECT: BATCH_STATUS_OBJECT,
} as const;

// ── Exported Types ─────────────────────────────────────────

export type IDayOfWeek = (typeof DAY_OF_WEEK_OBJECT)[keyof typeof DAY_OF_WEEK_OBJECT];
export type IBatchStatus = (typeof BATCH_STATUS_OBJECT)[keyof typeof BATCH_STATUS_OBJECT];
