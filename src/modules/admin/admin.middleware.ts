import { FastifyRequest, FastifyReply } from "fastify";
import { jwtDecrypt } from "jose";
import { env } from "../../config/env.js";
import { IAdminRole } from "./admin.types.js";
import { JwtPayload, generateAccessToken } from "./admin.service.js";

// Secret keys — must be 32+ chars in .env
const accessSecret = new TextEncoder().encode(env.ADMIN_JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.ADMIN_JWT_REFRESH_SECRET);

// ✅ Same cookie options — removed secret/signed (handled globally by plugin)
export const accessCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  // domain: env.IS_PRODUCTION ? ".DOMAIN.com" : undefined,
  maxAge: env.ADMIN_COOKIE_ACCESS_MAX_AGE,
  signed: true, // ✅ just this — plugin handles it globally
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  // domain: env.IS_PRODUCTION ? ".DOMAIN.com" : undefined,
  maxAge: env.ADMIN_COOKIE_REFRESH_MAX_AGE,
  signed: true, // ✅ just this — plugin handles it globally
};

declare module "fastify" {
  interface FastifyRequest {
    admin?: JwtPayload;
  }
}

// ── Jose JWE helpers ──────────────────────────
async function decryptAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtDecrypt(token, accessSecret);
  return payload as unknown as JwtPayload;
}

async function decryptRefreshToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtDecrypt(token, refreshSecret);
  return payload as unknown as JwtPayload;
}

// ── Read & unsign cookies ─────────────────────
function getSignedCookie(req: FastifyRequest, name: string): string | null {
  const raw = req.cookies?.[name];
  if (!raw) return null;
  const { valid, value } = req.unsignCookie(raw);
  if (!valid || !value) return null; // tampered!
  return value;
}

export async function verifyAdminToken(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const accessToken = getSignedCookie(req, env.ADMIN_COOKIE_ACCESS_NAME);
  const refreshToken = getSignedCookie(req, env.ADMIN_COOKIE_REFRESH_NAME);

  // 1. Check if Access Token exists
  if (accessToken) {
    try {
      // Check its expired if exist and not expired then can move next
      const decoded = await decryptAccessToken(accessToken);
      req.admin = decoded;
      return;
    } catch (err) {
      // Access token is expired or invalid. Now you have to check refresh token exist or not.
      if (refreshToken) {
        try {
          // Check refresh token valid and not expired
          const decodedRefresh = await decryptRefreshToken(refreshToken);

          // Decode data and generate access token newly (strip JWT meta fields)
          const { iat, exp, ...payloadData } = decodedRefresh as any;
          const newAccessToken = await generateAccessToken(payloadData);

          // Set access token to cookie
          reply.setCookie(
            env.ADMIN_COOKIE_ACCESS_NAME,
            newAccessToken,
            accessCookieOptions,
          );

          req.admin = payloadData as JwtPayload;
          return; // move next
        } catch (errRefresh) {
          // If refresh token expired then logout
          reply.clearCookie(env.ADMIN_COOKIE_ACCESS_NAME, accessCookieOptions);
          reply.clearCookie(
            env.ADMIN_COOKIE_REFRESH_NAME,
            refreshCookieOptions,
          );
          return reply
            .status(401)
            .send({ success: false, message: "Not authenticated" });
        }
      } else {
        // Access token invalid AND refresh token does not exist, then logout
        reply.clearCookie(env.ADMIN_COOKIE_ACCESS_NAME, accessCookieOptions);
        reply.clearCookie(env.ADMIN_COOKIE_REFRESH_NAME, refreshCookieOptions);
        return reply
          .status(401)
          .send({ success: false, message: "Not authenticated" });
      }
    }
  } else {
    // Access token does not exist. Then you have to check refresh token exist or not.
    if (refreshToken) {
      try {
        // Check refresh token valid and not expired
        const decodedRefresh = await decryptRefreshToken(refreshToken);

        // Decode data and generate access token newly
        const { iat, exp, ...payloadData } = decodedRefresh as any;
        const newAccessToken = await generateAccessToken(payloadData);

        // Set access token to cookie
        reply.setCookie(
          env.ADMIN_COOKIE_ACCESS_NAME,
          newAccessToken,
          accessCookieOptions,
        );

        req.admin = payloadData as JwtPayload;
        return; // move next
      } catch (errRefresh) {
        // If refresh token expired then logout
        reply.clearCookie(env.ADMIN_COOKIE_ACCESS_NAME, accessCookieOptions);
        reply.clearCookie(env.ADMIN_COOKIE_REFRESH_NAME, refreshCookieOptions);
        return reply
          .status(401)
          .send({ success: false, message: "Not authenticated" });
      }
    } else {
      // Neither access token nor refresh token exist, then logout
      reply.clearCookie(env.ADMIN_COOKIE_ACCESS_NAME, accessCookieOptions);
      reply.clearCookie(env.ADMIN_COOKIE_REFRESH_NAME, refreshCookieOptions);
      return reply
        .status(401)
        .send({ success: false, message: "Not authenticated" });
    }
  }
}

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
