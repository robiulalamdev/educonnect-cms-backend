import { FastifyRequest, FastifyReply } from "fastify";
import { jwtDecrypt } from "jose";
import { env } from "../../config/env.js";
import { IAdminRole } from "./admin.types.js";
import { JwtPayload, generateAccessToken } from "./admin.service.js";

const accessSecret = new TextEncoder().encode(env.ADMIN_JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.ADMIN_JWT_REFRESH_SECRET);

// ── Cookie options ─────────────────────────────────────────

export const accessCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: env.ADMIN_COOKIE_ACCESS_MAX_AGE,
  signed: true,
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: env.ADMIN_COOKIE_REFRESH_MAX_AGE,
  signed: true,
};

// ── Extend FastifyRequest ──────────────────────────────────

declare module "fastify" {
  interface FastifyRequest {
    admin?: JwtPayload;
  }
}

// ── Helpers ────────────────────────────────────────────────

async function decryptAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtDecrypt(token, accessSecret);
  return payload as unknown as JwtPayload;
}

async function decryptRefreshToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtDecrypt(token, refreshSecret);
  return payload as unknown as JwtPayload;
}

function getSignedCookie(req: FastifyRequest, name: string): string | null {
  const raw = req.cookies?.[name];
  if (!raw) return null;
  const { valid, value } = req.unsignCookie(raw);
  if (!valid || !value) return null;
  return value;
}

function clearAuthCookies(reply: FastifyReply) {
  reply
    .clearCookie(env.ADMIN_COOKIE_ACCESS_NAME, { path: "/" })
    .clearCookie(env.ADMIN_COOKIE_REFRESH_NAME, { path: "/" });
}

// ── Main auth middleware ───────────────────────────────────

export async function verifyAdminToken(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const accessToken = getSignedCookie(req, env.ADMIN_COOKIE_ACCESS_NAME);
  const refreshToken = getSignedCookie(req, env.ADMIN_COOKIE_REFRESH_NAME);

  // helper: try to restore session from refresh token
  async function restoreFromRefresh(): Promise<boolean> {
    if (!refreshToken) return false;
    try {
      const decoded = await decryptRefreshToken(refreshToken);
      const { iat, exp, ...payloadData } = decoded as any;
      const newAccessToken = await generateAccessToken(
        payloadData as JwtPayload,
      );
      reply.setCookie(
        env.ADMIN_COOKIE_ACCESS_NAME,
        newAccessToken,
        accessCookieOptions,
      );
      req.admin = payloadData as JwtPayload;
      return true;
    } catch {
      return false;
    }
  }

  if (accessToken) {
    try {
      req.admin = await decryptAccessToken(accessToken);
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
  clearAuthCookies(reply);
  return reply
    .status(401)
    .send({ success: false, message: "Not authenticated" });
}

// ── Role guard ─────────────────────────────────────────────

export function requireRole(...roles: IAdminRole[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.admin) {
      return reply
        .status(401)
        .send({ success: false, message: "Not authenticated" });
    }
    if (!roles.includes(req.admin.role)) {
      return reply.status(403).send({
        success: false,
        message: "Forbidden — insufficient permissions",
      });
    }
  };
}
