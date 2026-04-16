import { createHash } from "node:crypto";
import { env } from "./env";


// Helper to ensure keys are exactly 256-bit for A256GCM
const deriveKey = (secret: string) => 
  createHash("sha256").update(secret).digest();

export const jwtConfig = {
  admin: {
    accessSecret: deriveKey(env.ADMIN_JWT_ACCESS_SECRET),
    refreshSecret: deriveKey(env.ADMIN_JWT_REFRESH_SECRET),
    expires: {
      access: env.ADMIN_JWT_ACCESS_EXPIRES,
      refresh: env.ADMIN_JWT_REFRESH_EXPIRES,
    }
  },
  user: {
    accessSecret: deriveKey(env.JWT_ACCESS_SECRET),
    refreshSecret: deriveKey(env.JWT_REFRESH_SECRET),
    expires: {
      access: env.JWT_ACCESS_EXPIRES,
      refresh: env.JWT_REFRESH_EXPIRES,
    }
  }
} as const;