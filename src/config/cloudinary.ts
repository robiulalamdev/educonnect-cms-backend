import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// ── Folder keys per entity ─────────────────────────────────

export const CLD_FOLDERS = {
  // Users
  USER_AVATARS: "coachly/users/avatars",

  // Admin
  ADMIN_AVATARS: "coachly/admins/avatars",

  // Posts
  POST_MEDIA: "coachly/posts/media",

  // Services
  SERVICE_COVERS: "coachly/services/covers",

  // Payment
  PAYMENT_SCREENSHOTS: "coachly/payments/screenshots",

  // Tasks
  TASK_ATTACHMENTS: "coachly/tasks/attachments",

  // Daily Notes
  NOTE_ATTACHMENTS: "coachly/notes/attachments",

  // Announcements
  ANNOUNCEMENT_MEDIA: "coachly/announcements/media",

  // Messages
  MESSAGE_MEDIA: "coachly/messages/media",
} as const;

export type CldFolder = (typeof CLD_FOLDERS)[keyof typeof CLD_FOLDERS];

// ── Accepted mimetypes per folder ─────────────────────────

export const CLD_ACCEPTED_TYPES: Record<CldFolder, string[]> = {
  [CLD_FOLDERS.USER_AVATARS]: ["image/jpeg", "image/png", "image/webp"],

  [CLD_FOLDERS.ADMIN_AVATARS]: ["image/jpeg", "image/png", "image/webp"],

  [CLD_FOLDERS.POST_MEDIA]: [
    "image/jpeg",
    "image/png",
    "image/webp",
    // "application/pdf",
  ],

  [CLD_FOLDERS.SERVICE_COVERS]: ["image/jpeg", "image/png", "image/webp"],

  [CLD_FOLDERS.PAYMENT_SCREENSHOTS]: ["image/jpeg", "image/png", "image/webp"],

  [CLD_FOLDERS.TASK_ATTACHMENTS]: [
    "image/jpeg",
    "image/png",
    "image/webp",
    // "application/pdf",
    // "application/msword",
    // "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],

  [CLD_FOLDERS.NOTE_ATTACHMENTS]: [
    "image/jpeg",
    "image/png",
    "image/webp",
    // "application/pdf",
  ],

  [CLD_FOLDERS.ANNOUNCEMENT_MEDIA]: [
    "image/jpeg",
    "image/png",
    "image/webp",
    // "application/pdf",
  ],

  [CLD_FOLDERS.MESSAGE_MEDIA]: [
    "image/jpeg",
    "image/png",
    "image/webp",
    // "application/pdf",
    // "application/msword",
    // "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

// ── Max file size per folder (bytes) ──────────────────────

export const CLD_MAX_SIZE: Record<CldFolder, number> = {
  [CLD_FOLDERS.USER_AVATARS]: 2 * 1024 * 1024, // 2MB
  [CLD_FOLDERS.ADMIN_AVATARS]: 2 * 1024 * 1024, // 2MB
  [CLD_FOLDERS.POST_MEDIA]: 5 * 1024 * 1024, // 5MB
  [CLD_FOLDERS.SERVICE_COVERS]: 3 * 1024 * 1024, // 3MB
  [CLD_FOLDERS.PAYMENT_SCREENSHOTS]: 3 * 1024 * 1024, // 3MB
  [CLD_FOLDERS.TASK_ATTACHMENTS]: 10 * 1024 * 1024, // 10MB
  [CLD_FOLDERS.NOTE_ATTACHMENTS]: 5 * 1024 * 1024, // 5MB
  [CLD_FOLDERS.ANNOUNCEMENT_MEDIA]: 5 * 1024 * 1024, // 5MB
  [CLD_FOLDERS.MESSAGE_MEDIA]: 10 * 1024 * 1024, // 10MB
};

// ── Mime → resource type (Cloudinary needs this) ──────────

export const MIME_TO_RESOURCE_TYPE: Record<string, "image" | "raw"> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  //   "application/pdf": "raw",
  //   "application/msword": "raw",
  //   "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
  //     "raw",
};

// ── Mime → extension map ───────────────────────────────────

export const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  //   "application/pdf":  "pdf",
  //   "application/msword": "doc",
  //   "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
