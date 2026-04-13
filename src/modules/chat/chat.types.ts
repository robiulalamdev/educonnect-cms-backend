// ============================================================
// MODULE: chat.types.ts
// Chat types and message status constants
// ============================================================

export const CHAT_TYPE_OBJECT = {
  DIRECT: "DIRECT",
  BATCH_GROUP: "BATCH_GROUP",
} as const;

export const MESSAGE_STATUS_OBJECT = {
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
} as const;

export const CHAT_TYPES = {
  TYPES: ["DIRECT", "BATCH_GROUP"] as const,
  MESSAGE_STATUSES: ["SENT", "DELIVERED", "READ"] as const,
  
  TYPE_OBJECT: CHAT_TYPE_OBJECT,
  STATUS_OBJECT: MESSAGE_STATUS_OBJECT,
} as const;

// ── Exported Types ─────────────────────────────────────────

export type IChatType = (typeof CHAT_TYPE_OBJECT)[keyof typeof CHAT_TYPE_OBJECT];
export type IMessageStatus = (typeof MESSAGE_STATUS_OBJECT)[keyof typeof MESSAGE_STATUS_OBJECT];
