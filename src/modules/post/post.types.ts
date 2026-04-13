// ============================================================
// MODULE: post.types.ts
// Post types and status constants
// ============================================================

export const POST_TYPE_OBJECT = {
  OFFERING: "OFFERING",
  SEEKING: "SEEKING",
} as const;

export const POST_STATUS_OBJECT = {
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
  DELETED: "DELETED",
} as const;

export const POST_TYPES = {
  TYPES: ["OFFERING", "SEEKING"] as const,
  STATUSES: ["ACTIVE", "CLOSED", "DELETED"] as const,
  
  TYPE_OBJECT: POST_TYPE_OBJECT,
  STATUS_OBJECT: POST_STATUS_OBJECT,
} as const;

// ── Exported Types ─────────────────────────────────────────

export type IPostType = (typeof POST_TYPE_OBJECT)[keyof typeof POST_TYPE_OBJECT];
export type IPostStatus = (typeof POST_STATUS_OBJECT)[keyof typeof POST_STATUS_OBJECT];
