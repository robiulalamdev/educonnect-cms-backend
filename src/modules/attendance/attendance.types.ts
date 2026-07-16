// ============================================================
// MODULE: attendance.types.ts
// ============================================================

export const ATTENDANCE_STATUS_OBJECT = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LATE: "LATE",
  EXCUSED: "EXCUSED",
} as const;

export const ATTENDANCE_TYPES = {
  STATUSES: ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const,
  STATUS_OBJECT: ATTENDANCE_STATUS_OBJECT,
} as const;

export type IAttendanceStatus = (typeof ATTENDANCE_STATUS_OBJECT)[keyof typeof ATTENDANCE_STATUS_OBJECT];
