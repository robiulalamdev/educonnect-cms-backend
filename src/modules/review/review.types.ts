// ============================================================
// MODULE: review.types.ts
// ============================================================

export const REVIEW_STATUS_OBJECT = {
  VISIBLE: "VISIBLE",
  HIDDEN: "HIDDEN",
} as const;

export const REVIEW_TYPES = {
  STATUSES: ["VISIBLE", "HIDDEN"] as const,
  STATUS_OBJECT: REVIEW_STATUS_OBJECT,
} as const;

export type IReviewStatus = (typeof REVIEW_STATUS_OBJECT)[keyof typeof REVIEW_STATUS_OBJECT];
