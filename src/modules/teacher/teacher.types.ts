// ============================================================
// MODULE: teacher.types.ts
// Teacher-specific types and enums (Derived from enums.prisma)
// ============================================================

export const TEACHER_TYPES = {
  // --- User-Level Status ---
  USER_STATUS: {
    PENDING_VERIFICATION: "PENDING_VERIFICATION",
    ACTIVE: "ACTIVE",
    SUSPENDED: "SUSPENDED",
    BANNED: "BANNED",
  },

  // --- Profile Approval (Specific to Teacher) ---
  APPROVAL_STATUS: {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
  },

  // --- Service Related (From enums.prisma) ---
  SERVICE_MODE: {
    ONLINE: "ONLINE",
    OFFLINE: "OFFLINE",
    HYBRID: "HYBRID",
  },
  SERVICE_FORMAT: {
    BATCH: "BATCH",
    INDIVIDUAL: "INDIVIDUAL",
    HOME_PRIVATE: "HOME_PRIVATE",
  },
  SERVICE_STATUS: {
    DRAFT: "DRAFT",
    ACTIVE: "ACTIVE",
    PAUSED: "PAUSED",
    CLOSED: "CLOSED",
  },
} as const;

export type ITeacherUserStatus = keyof typeof TEACHER_TYPES.USER_STATUS;
export type IServiceMode = keyof typeof TEACHER_TYPES.SERVICE_MODE;
export type IServiceFormat = keyof typeof TEACHER_TYPES.SERVICE_FORMAT;
export type IServiceStatus = keyof typeof TEACHER_TYPES.SERVICE_STATUS;
