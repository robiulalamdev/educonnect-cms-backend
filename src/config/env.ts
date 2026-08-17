import dotenv from "dotenv";

dotenv.config();

/**
 * 1. DEFINE THE SCHEMA
 * This object defines which keys are required and what type they MUST be.
 */
const schema = {
  NODE_ENV: "string",
  PORT: "number",
  DATABASE_URL: "string",
  CORS_ORIGINS: "string",

  // USER ENV
  JWT_ACCESS_SECRET: "string",
  JWT_REFRESH_SECRET: "string",
  JWT_ACCESS_EXPIRES: "string", // e.g. '1d'
  JWT_REFRESH_EXPIRES: "string", // e.g. '30d'

  COOKIE_SECRET: "string",

  COOKIE_ACCESS_NAME: "string",
  COOKIE_REFRESH_NAME: "string",
  COOKIE_ACCESS_MAX_AGE: "number", // Must be numeric in .env
  COOKIE_REFRESH_MAX_AGE: "number",

  // ADMIN PANEL
  ADMIN_JWT_ACCESS_SECRET: "string",
  ADMIN_JWT_REFRESH_SECRET: "string",
  ADMIN_JWT_ACCESS_EXPIRES: "string",
  ADMIN_JWT_REFRESH_EXPIRES: "string",

  ADMIN_COOKIE_ACCESS_NAME: "string",
  ADMIN_COOKIE_REFRESH_NAME: "string",
  ADMIN_COOKIE_ACCESS_MAX_AGE: "number",
  ADMIN_COOKIE_REFRESH_MAX_AGE: "number",

  ADMIN_PANEL_ORIGINS: "string",

  // CLOUDFLARE R2
  // CF_ACCOUNT_ID: "string",
  // CF_ACCESS_KEY_ID: "string",
  // CF_SECRET_ACCESS_KEY: "string",
  // CF_BUCKET_NAME: "string",
  // CF_PUBLIC_URL: "string",

  // CLOUDINARY
  CLOUDINARY_ACCOUNT_ID: "string",
  CLOUDINARY_CLOUD_NAME: "string",
  CLOUDINARY_API_KEY: "string",
  CLOUDINARY_API_SECRET: "string",

  // EMAIL (GMAIL SMTP)
  GMAIL_USER: "string",
  GMAIL_APP_PASS: "string",

  // FIREBASE (FCM)
  FIREBASE_PROJECT_ID: "string",
  FIREBASE_CLIENT_EMAIL: "string",
  FIREBASE_PRIVATE_KEY: "string",
  FIREBASE_VAPID_PUBLIC_KEY: "string",
  FIREBASE_SENDER_ID: "string",

  // FRONTEND URLS (For Socket CORS)
  FRONTEND_URL: "string",
  ADMIN_FRONTEND_URL: "string",
} as const;

// This will hold our final validated data
const validatedEnv: any = {};

/**
 * 2. THE VALIDATION LOOP
 * This loops through the SCHEMA and checks against process.env
 */
Object.entries(schema).forEach(([key, expectedType]) => {
  const value = process.env[key];

  // CHECK 1: Does it exist?
  if (value === undefined || value.trim() === "") {
    throw new Error(
      `❌ MISSING ENV: [${key}] is required but not found in .env`,
    );
  }

  // CHECK 2: Type Enforcement
  if (expectedType === "number") {
    const parsedNumber = Number(value);

    // If Number(value) results in NaN, it means the .env value was a non-numeric string
    if (isNaN(parsedNumber)) {
      throw new Error(
        `❌ TYPE ERROR: [${key}] must be a NUMBER, but received string "${value}"`,
      );
    }
    validatedEnv[key] = parsedNumber;
  } else {
    // If expected type is string, we just pass it through
    validatedEnv[key] = value;
  }
});

/**
 * 3. FINAL EXPORT
 * We manually add the boolean helper and export with full TypeScript types.
 */
export const env = {
  ...validatedEnv,
  IS_PRODUCTION: process.env.NODE_ENV === "production",
} as {
  [K in keyof typeof schema]: (typeof schema)[K] extends "number"
    ? number
    : string;
} & { IS_PRODUCTION: boolean };
