// ============================================================
// MODULE: task.types.ts
// ============================================================

export const TASK_STATUS_OBJECT = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const TASK_TYPES = {
  STATUSES: ["ACTIVE", "COMPLETED", "CANCELLED"] as const,
  STATUS_OBJECT: TASK_STATUS_OBJECT,
} as const;

export type ITaskStatus = (typeof TASK_STATUS_OBJECT)[keyof typeof TASK_STATUS_OBJECT];
