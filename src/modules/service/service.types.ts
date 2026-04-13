// ============================================================
// MODULE: service.types.ts
// Service modes, formats, and status constants
// ============================================================

export const SERVICE_MODE_OBJECT = {
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
  HYBRID: "HYBRID",
} as const;

export const SERVICE_FORMAT_OBJECT = {
  BATCH: "BATCH",
  INDIVIDUAL: "INDIVIDUAL",
  HOME_PRIVATE: "HOME_PRIVATE",
} as const;

export const SERVICE_STATUS_OBJECT = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  CLOSED: "CLOSED",
} as const;

export const SERVICE_TYPES = {
  MODES: ["ONLINE", "OFFLINE", "HYBRID"] as const,
  FORMATS: ["BATCH", "INDIVIDUAL", "HOME_PRIVATE"] as const,
  STATUS: ["DRAFT", "ACTIVE", "PAUSED", "CLOSED"] as const,
  
  MODE_OBJECT: SERVICE_MODE_OBJECT,
  FORMAT_OBJECT: SERVICE_FORMAT_OBJECT,
  STATUS_OBJECT: SERVICE_STATUS_OBJECT,
} as const;

// ── Exported Types ─────────────────────────────────────────

export type IServiceMode = (typeof SERVICE_MODE_OBJECT)[keyof typeof SERVICE_MODE_OBJECT];
export type IServiceFormat = (typeof SERVICE_FORMAT_OBJECT)[keyof typeof SERVICE_FORMAT_OBJECT];
export type IServiceStatus = (typeof SERVICE_STATUS_OBJECT)[keyof typeof SERVICE_STATUS_OBJECT];
