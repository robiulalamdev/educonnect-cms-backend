import { FastifyRequest, FastifyReply } from "fastify";
import { jwtDecrypt } from "jose";
import { env } from "../../config/env.js";
import type { IUserRole } from "./auth.types.js";
import { generateUserAccessToken, type UserJwtPayload } from "./auth.service.js";

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

// ── Cookie Options ─────────────────────────────────────────

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
    user?: UserJwtPayload;
  }
}

// ── Helpers ────────────────────────────────────────────────

async function decryptAccessToken(token: string): Promise<UserJwtPayload> {
  const { payload } = await jwtDecrypt(token, accessSecret);
  return payload as unknown as UserJwtPayload;
}

async function decryptRefreshToken(token: string): Promise<UserJwtPayload> {
  const { payload } = await jwtDecrypt(token, refreshSecret);
  return payload as unknown as UserJwtPayload;
}

function getSignedCookie(req: FastifyRequest, name: string): string | null {
  const raw = req.cookies?.[name];
  if (!raw) return null;
  const { valid, value } = req.unsignCookie(raw);
  if (!valid || !value) return null;
  return value;
}

function clearUserCookies(reply: FastifyReply) {
  reply
    .clearCookie(env.COOKIE_ACCESS_NAME, { path: "/" })
    .clearCookie(env.COOKIE_REFRESH_NAME, { path: "/" });
}

// ── Main Auth Middleware ───────────────────────────────────

export async function verifyUserToken(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const accessToken = getSignedCookie(req, env.COOKIE_ACCESS_NAME);
  const refreshToken = getSignedCookie(req, env.COOKIE_REFRESH_NAME);

  // helper: restore session from a valid refresh token
  async function restoreFromRefresh(): Promise<boolean> {
    if (!refreshToken) return false;
    try {
      const decoded = await decryptRefreshToken(refreshToken);
      const { iat, exp, ...payloadData } = decoded as any;
      const newAccessToken = await generateUserAccessToken(
        payloadData as UserJwtPayload,
      );
      reply.setCookie(
        env.COOKIE_ACCESS_NAME,
        newAccessToken,
        userAccessCookieOptions,
      );
      req.user = payloadData as UserJwtPayload;
      return true;
    } catch {
      return false;
    }
  }

  if (accessToken) {
    try {
      req.user = await decryptAccessToken(accessToken);
      return;
    } catch {
      // access token expired — try refresh
      const restored = await restoreFromRefresh();
      if (restored) return;
    }
  } else {
    // no access token — try refresh
    const restored = await restoreFromRefresh();
    if (restored) return;
  }

  // nothing worked — clear and reject
  clearUserCookies(reply);
  return reply
    .status(401)
    .send({ success: false, message: "Not authenticated" });
}

// ── Role Guard ─────────────────────────────────────────────

export function requireUserRole(...roles: IUserRole[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply
        .status(401)
        .send({ success: false, message: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return reply.status(403).send({
        success: false,
        message: "Forbidden — insufficient permissions",
      });
    }
  };
}
