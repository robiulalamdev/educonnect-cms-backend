import { FastifyRequest, FastifyReply } from "fastify";
import { jwtDecrypt } from "jose";
import { env } from "../config/env.js";
import type { IAdminRole } from "../modules/admin/admin.types.js";
import type { IUserRole } from "../modules/auth/auth.types.js";
import { generateUserAccessToken, type UserJwtPayload } from "../modules/auth/auth.service.js";
import { generateAdminAccessToken, type JwtPayload as AdminJwtPayload } from "../modules/admin/admin.service.js";
import { jwtConfig } from "../config/jwt.js";

const adminAccessSecret = jwtConfig.admin.accessSecret;
const adminRefreshSecret = jwtConfig.admin.refreshSecret;
const userAccessSecret = jwtConfig.user.accessSecret;
const userRefreshSecret = jwtConfig.user.refreshSecret;

// ── Cookie Options ─────────────────────────────────────────

export const adminAccessCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: env.ADMIN_COOKIE_ACCESS_MAX_AGE,
  signed: true,
};

export const adminRefreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: env.ADMIN_COOKIE_REFRESH_MAX_AGE,
  signed: true,
};

export const userAccessCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: env.COOKIE_ACCESS_MAX_AGE,
  signed: true,
};

export const userRefreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: env.COOKIE_REFRESH_MAX_AGE,
  signed: true,
};

// ── Extend FastifyRequest ──────────────────────────────────

declare module "fastify" {
  interface FastifyRequest {
    admin?: AdminJwtPayload;
    user?: UserJwtPayload;
  }
}

// ── Helpers ────────────────────────────────────────────────

async function decryptToken<T>(token: string, secret: Uint8Array): Promise<T> {
  const { payload } = await jwtDecrypt(token, secret);
  return payload as unknown as T;
}

function getSignedCookie(req: FastifyRequest, name: string): string | null {
  const raw = req.cookies?.[name];
  if (!raw) return null;
  const { valid, value } = req.unsignCookie(raw);
  if (!valid || !value) return null;
  return value;
}

// ── Auth Middlewares ────────────────────────────────────────

/**
 * Common Authentication: Tries to resolve identity via Admin or User cookies.
 */
export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  // 1. Try Admin Auth
  const adminAccessToken = getSignedCookie(req, env.ADMIN_COOKIE_ACCESS_NAME);
  const adminRefreshToken = getSignedCookie(req, env.ADMIN_COOKIE_REFRESH_NAME);

  if (adminAccessToken || adminRefreshToken) {
    try {
      if (adminAccessToken) {
        req.admin = await decryptToken<AdminJwtPayload>(adminAccessToken, adminAccessSecret);
        return;
      }
    } catch {
      // access token expired — try refresh
      if (adminRefreshToken) {
        try {
          const decoded = await decryptToken<AdminJwtPayload>(adminRefreshToken, adminRefreshSecret);
          const { iat, exp, ...payloadData } = decoded as any;
          const newAccessToken = await generateAdminAccessToken(payloadData as AdminJwtPayload);
          reply.setCookie(env.ADMIN_COOKIE_ACCESS_NAME, newAccessToken, adminAccessCookieOptions);
          req.admin = payloadData as AdminJwtPayload;
          return;
        } catch { /* session failed */ }
      }
    }
  }

  // 2. Try User Auth
  const userAccessToken = getSignedCookie(req, env.COOKIE_ACCESS_NAME);
  const userRefreshToken = getSignedCookie(req, env.COOKIE_REFRESH_NAME);

  if (userAccessToken || userRefreshToken) {
    try {
      if (userAccessToken) {
        req.user = await decryptToken<UserJwtPayload>(userAccessToken, userAccessSecret);
        return;
      }
    } catch {
      // access token expired — try refresh
      if (userRefreshToken) {
        try {
          const decoded = await decryptToken<UserJwtPayload>(userRefreshToken, userRefreshSecret);
          const { iat, exp, ...payloadData } = decoded as any;
          const newAccessToken = await generateUserAccessToken(payloadData as UserJwtPayload);
          reply.setCookie(env.COOKIE_ACCESS_NAME, newAccessToken, userAccessCookieOptions);
          req.user = payloadData as UserJwtPayload;
          return;
        } catch { /* session failed */ }
      }
    }
  }

  // If both failed, we don't reject yet. Guard will handle it.
  // This allows public routes to pass through with req.admin/req.user being undefined.
}

/**
 * Unified Role Guard
 */
export function requireRole(...roles: (IAdminRole | IUserRole)[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    // Check Admin Identity
    if (req.admin && roles.includes(req.admin.role as any)) {
      return;
    }

    // Check User Identity
    if (req.user && roles.includes(req.user.role as any)) {
      return;
    }

    // If we're here, it's either unauthenticated or insufficient permissions
    if (!req.admin && !req.user) {
      return reply.status(401).send({ success: false, message: "Not authenticated" });
    }

    return reply.status(403).send({
      success: false,
      message: "Forbidden — insufficient permissions",
    });
  };
}
