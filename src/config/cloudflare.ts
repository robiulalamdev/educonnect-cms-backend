// import { S3Client } from "@aws-sdk/client-s3";
// import { env } from "./env";

// export const r2Client = new S3Client({
//   region: "auto",
//   endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
//   credentials: {
//     accessKeyId: env.CF_ACCESS_KEY_ID,
//     secretAccessKey: env.CF_SECRET_ACCESS_KEY,
//   },
// });

// // Folder keys per entity — keeps R2 bucket organised
// export const CF_FOLDERS = {
//   DEVICE_IMAGES: "devices/images",
//   BRAND_LOGOS: "brands/logos",
//   VARIANT_IMAGES: "devices/variants",
//   CATEGORY_ICONS: "categories/icons",
//   SERIES_IMAGES: "series/images",
//   ADMIN_AVATARS: "admins/avatars",
// } as const;

// export type CFFolder = (typeof CF_FOLDERS)[keyof typeof CF_FOLDERS];

// // Accepted mimetypes per folder
// export const CF_ACCEPTED_TYPES: Record<CFFolder, string[]> = {
//   [CF_FOLDERS.DEVICE_IMAGES]: ["image/jpeg", "image/png", "image/webp"],
//   [CF_FOLDERS.BRAND_LOGOS]: [
//     "image/jpeg",
//     "image/png",
//     "image/webp",
//     "image/svg+xml",
//   ],
//   [CF_FOLDERS.VARIANT_IMAGES]: ["image/jpeg", "image/png", "image/webp"],
//   [CF_FOLDERS.CATEGORY_ICONS]: [
//     "image/jpeg",
//     "image/png",
//     "image/webp",
//     // "image/svg+xml",
//   ],
//   [CF_FOLDERS.SERIES_IMAGES]: [
//     "image/jpeg",
//     "image/png",
//     "image/webp",
//     // "image/svg+xml",
//   ],
//   [CF_FOLDERS.ADMIN_AVATARS]: ["image/jpeg", "image/png", "image/webp"],
// };
