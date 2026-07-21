// ============================================================
// MODULE: admin.types.ts
// Admin roles, status, permissions, audit actions
// ============================================================

// ── Roles ──────────────────────────────────────────────────

export const ROLE_OBJECT = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
} as const;

// ── Audit Actions ──────────────────────────────────────────

export const AUDIT_ACTION_OBJECT = {
  USER_APPROVED: "USER_APPROVED",
  USER_SUSPENDED: "USER_SUSPENDED",
  USER_BANNED: "USER_BANNED",
  POST_REMOVED: "POST_REMOVED",
  REVIEW_HIDDEN: "REVIEW_HIDDEN",
  SERVICE_CLOSED: "SERVICE_CLOSED",
  ADMIN_CREATED: "ADMIN_CREATED",
  ADMIN_ROLE_CHANGED: "ADMIN_ROLE_CHANGED",
  PACKAGE_CREATED: "PACKAGE_CREATED",
  PACKAGE_UPDATED: "PACKAGE_UPDATED",
  PACKAGE_ARCHIVED: "PACKAGE_ARCHIVED",
  SUBSCRIPTION_GRANTED: "SUBSCRIPTION_GRANTED",
  SUBSCRIPTION_REVOKED: "SUBSCRIPTION_REVOKED",
} as const;

// ── Main Types Object ──────────────────────────────────────

export const ADMIN_TYPES = {
  ROLES: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] as const,

  STATUS: ["ACTIVE", "INACTIVE"] as const,

  ROLE_OBJECT,

  AUDIT_ACTIONS: [
    "USER_APPROVED",
    "USER_SUSPENDED",
    "USER_BANNED",
    "POST_REMOVED",
    "REVIEW_HIDDEN",
    "SERVICE_CLOSED",
    "ADMIN_CREATED",
    "ADMIN_ROLE_CHANGED",
    "PACKAGE_CREATED",
    "PACKAGE_UPDATED",
    "PACKAGE_ARCHIVED",
    "SUBSCRIPTION_GRANTED",
    "SUBSCRIPTION_REVOKED",
  ] as const,

  // ── Permission groups — use these in routes, not raw role arrays ──

  PERMISSIONS: {
    // Who can view dashboard data
    CAN_VIEW: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] as const,

    // Who can create/update content
    CAN_WRITE: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] as const,

    // Who can delete content
    CAN_DELETE: ["SUPER_ADMIN", "ADMIN"] as const,

    // Who can view admin users list
    CAN_VIEW_ADMINS: ["SUPER_ADMIN", "ADMIN"] as const,

    // Who can edit admin info (name, email etc) — not register/delete
    CAN_EDIT_ADMIN: ["SUPER_ADMIN", "ADMIN"] as const,

    // Who can register new admins
    CAN_REGISTER_ADMIN: ["SUPER_ADMIN"] as const,

    // Who can delete admin accounts
    CAN_DELETE_ADMIN: ["SUPER_ADMIN"] as const,

    // Who can approve/reject teacher registrations
    CAN_APPROVE_TEACHER: ["SUPER_ADMIN", "ADMIN"] as const,

    // Who can suspend/ban users
    CAN_SUSPEND_USER: ["SUPER_ADMIN", "ADMIN"] as const,

    // Who can ban users permanently
    CAN_BAN_USER: ["SUPER_ADMIN"] as const,

    // Who can remove/hide posts
    CAN_MODERATE_POST: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] as const,

    // Who can hide reviews
    CAN_MODERATE_REVIEW: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] as const,

    // Who can close a service forcefully
    CAN_CLOSE_SERVICE: ["SUPER_ADMIN", "ADMIN"] as const,

    // Who can view audit logs
    CAN_VIEW_AUDIT_LOG: ["SUPER_ADMIN", "ADMIN"] as const,

    // Who can manage education levels and subjects
    CAN_MANAGE_EDUCATION: ["SUPER_ADMIN", "ADMIN"] as const,

    // Who can add notes on any user profile
    CAN_ADD_ADMIN_NOTE: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] as const,

    // Who can manage guardian-student links directly
    CAN_MANAGE_GUARDIAN_LINKS: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] as const,
  },
} as const;

// ── Exported Types ─────────────────────────────────────────

export type IAdminRole = (typeof ROLE_OBJECT)[keyof typeof ROLE_OBJECT];
export type IAdminStatus = (typeof ADMIN_TYPES.STATUS)[number];
export type IAuditAction =
  (typeof AUDIT_ACTION_OBJECT)[keyof typeof AUDIT_ACTION_OBJECT];
export type IAdminPermission = keyof typeof ADMIN_TYPES.PERMISSIONS;
