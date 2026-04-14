// ============================================================
// MODULE: student.types.ts
// Student-specific types and enums (Derived from enums.prisma)
// ============================================================

export const STUDENT_TYPES = {
  // --- Enrollment (From enums.prisma) ---
  ENROLLMENT_STATUS: {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    WAITLISTED: "WAITLISTED",
    REMOVED: "REMOVED",
    SUSPENDED: "SUSPENDED",
    LEFT: "LEFT",
  },

  // --- Attendance (From enums.prisma) ---
  ATTENDANCE_STATUS: {
    PRESENT: "PRESENT",
    ABSENT: "ABSENT",
    LATE: "LATE",
    EXCUSED: "EXCUSED",
  },

  // --- Tasks (From enums.prisma) ---
  TASK_STATUS: {
    ACTIVE: "ACTIVE",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
  },
} as const;

export type IEnrollmentStatus = keyof typeof STUDENT_TYPES.ENROLLMENT_STATUS;
export type IAttendanceStatus = keyof typeof STUDENT_TYPES.ATTENDANCE_STATUS;
export type ITaskStatus = keyof typeof STUDENT_TYPES.TASK_STATUS;
