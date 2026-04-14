// ============================================================
// MODULE: subscription.types.ts
// Subscription-specific types and enums (Derived from enums.prisma)
// ============================================================

export const SUBSCRIPTION_TYPES = {
  // --- Package Status (From enums.prisma) ---
  PACKAGE_STATUS: ["ACTIVE", "INACTIVE", "ARCHIVED"] as const,

  // --- Billing Cycle (From enums.prisma) ---
  BILLING_CYCLES: ["MONTHLY", "QUARTERLY", "YEARLY", "LIFETIME"] as const,

  // --- Payment Methods (From enums.prisma) ---
  PAYMENT_METHODS: [
    "BKASH",
    "NAGAD",
    "ROCKET",
    "BANK_TRANSFER",
    "CASH",
    "OTHER",
  ] as const,

  // --- Subscription Status (From enums.prisma) ---
  SUBSCRIPTION_STATUS: ["ACTIVE", "EXPIRED", "CANCELLED"] as const,
} as const;

export type IPackageStatus = (typeof SUBSCRIPTION_TYPES.PACKAGE_STATUS)[number];
export type IBillingCycle = (typeof SUBSCRIPTION_TYPES.BILLING_CYCLES)[number];
export type IPaymentMethod = (typeof SUBSCRIPTION_TYPES.PAYMENT_METHODS)[number];
export type ISubscriptionStatus = (typeof SUBSCRIPTION_TYPES.SUBSCRIPTION_STATUS)[number];
