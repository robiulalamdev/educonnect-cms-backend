// ============================================================
// MODULE: guardian.types.ts
// Guardian-specific types and enums (Derived from enums.prisma)
// ============================================================

export const GUARDIAN_TYPES = {
  // --- Guardian-Student Relation (From enums.prisma) ---
  LINK_STATUS: {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    REMOVED: "REMOVED",
  },
} as const;

export type IGuardianLinkStatus = keyof typeof GUARDIAN_TYPES.LINK_STATUS;
