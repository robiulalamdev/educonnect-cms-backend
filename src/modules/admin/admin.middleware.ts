import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { IAdminRole } from "./admin.types.js";
import { JwtPayload, generateAccessToken } from "./admin.service.js";

// ✅ Fixed cookie options
export const accessCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  // domain: env.IS_PRODUCTION ? ".DOMAIN.com" : undefined,
  maxAge: env.ADMIN_COOKIE_ACCESS_MAX_AGE,
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  // domain: env.IS_PRODUCTION ? ".DOMAIN.com" : undefined,
  maxAge: env.ADMIN_COOKIE_REFRESH_MAX_AGE,
};

declare module "fastify" {
  interface FastifyRequest {
    admin?: JwtPayload;
  }
}

export async function verifyAdminToken(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const accessToken = req.cookies?.[env.ADMIN_COOKIE_ACCESS_NAME];
  const refreshToken = req.cookies?.[env.ADMIN_COOKIE_REFRESH_NAME];

  // 1. Check if Access Token exists
  if (accessToken) {
    try {
      // Check its expired if exist and not expired then can move next
      const decoded = jwt.verify(
        accessToken,
        env.ADMIN_JWT_ACCESS_SECRET,
      ) as JwtPayload;
      req.admin = decoded;
      return;
    } catch (err) {
      // Access token is expired or invalid. Now you have to check refresh token exist or not.
      if (refreshToken) {
        try {
          // Check refresh token valid and not expired
          const decodedRefresh = jwt.verify(
            refreshToken,
            env.ADMIN_JWT_REFRESH_SECRET,
          ) as JwtPayload;

          // Decode data and generate access token newly (strip JWT meta fields)
          const { iat, exp, ...payloadData } = decodedRefresh as any;
          const newAccessToken = generateAccessToken(payloadData);

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
        const decodedRefresh = jwt.verify(
          refreshToken,
          env.ADMIN_JWT_REFRESH_SECRET,
        ) as JwtPayload;

        // Decode data and generate access token newly
        const { iat, exp, ...payloadData } = decodedRefresh as any;
        const newAccessToken = generateAccessToken(payloadData);

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
