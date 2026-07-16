import { FastifyRequest, FastifyReply } from "fastify";
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schema.js";
import {
  registerUser,
  loginUser,
  refreshUserToken,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  changeUserPassword,
  getUserProfile,
  updateUserProfile,
} from "./auth.service.js";
import {
  userAccessCookieOptions,
  userRefreshCookieOptions,
} from "./auth.middleware.js";
import { env } from "../../config/env.js";
import { parseMultipart } from "../../utils/parse-multipart.js";
import { MultipartValidationError } from "../../utils/parse-multipart.js";
import { CLD_FOLDERS } from "../../config/cloudinary.js";
const COOKIE_ACCESS = env.COOKIE_ACCESS_NAME;
const COOKIE_REFRESH = env.COOKIE_REFRESH_NAME;
// ── Register ───────────────────────────────────────────────
export async function registerController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = registerSchema.safeParse(req.body);
  if (!body.success)
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });
  try {
    const user = await registerUser(body.data);
    return reply.status(201).send({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
      data: { user },
    });
  } catch (err: any) {
    if (err.message === "EMAIL_TAKEN")
      return reply
        .status(409)
        .send({ success: false, message: "Email already in use" });
    throw err;
  }
}
// ── Login ──────────────────────────────────────────────────
export async function loginController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = loginSchema.safeParse(req.body);
  if (!body.success)
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });
  try {
    const { user, tokens } = await loginUser(body.data);
    reply
      .setCookie(COOKIE_ACCESS, tokens.accessToken, userAccessCookieOptions)
      .setCookie(COOKIE_REFRESH, tokens.refreshToken, userRefreshCookieOptions);
    return reply.status(200).send({
      success: true,
      message: "Login successful",
      data: { user },
    });
  } catch (err: any) {
    if (err.message === "INVALID_CREDENTIALS")
      return reply
        .status(401)
        .send({ success: false, message: "Invalid email or password" });
    if (err.message === "EMAIL_NOT_VERIFIED")
      return reply.status(403).send({
        success: false,
        message:
          "Email not verified. Please check your inbox and verify your email first.",
      });
    if (err.message === "ACCOUNT_SUSPENDED")
      return reply.status(403).send({
        success: false,
        message:
          "Your account has been suspended. Please contact support for assistance.",
      });
    if (err.message === "ACCOUNT_BANNED")
      return reply.status(403).send({
        success: false,
        message: "Your account has been permanently banned.",
      });
    throw err;
  }
}
// ── Refresh ────────────────────────────────────────────────
export async function refreshController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const raw = req.cookies?.[COOKIE_REFRESH];
  if (!raw)
    return reply
      .status(401)
      .send({ success: false, message: "No refresh token" });
  const { valid, value: refreshToken } = req.unsignCookie(raw);
  if (!valid || !refreshToken) {
    reply
      .clearCookie(COOKIE_ACCESS, { path: "/" })
      .clearCookie(COOKIE_REFRESH, { path: "/" });
    return reply
      .status(401)
      .send({ success: false, message: "Invalid session" });
  }
  try {
    const tokens = await refreshUserToken(refreshToken);
    reply.setCookie(COOKIE_ACCESS, tokens.accessToken, userAccessCookieOptions);
    return reply.send({ success: true, message: "Session refreshed" });
  } catch (err: any) {
    reply
      .clearCookie(COOKIE_ACCESS, { path: "/" })
      .clearCookie(COOKIE_REFRESH, { path: "/" });
    if (err.message === "ACCOUNT_SUSPENDED")
      return reply.status(403).send({
        success: false,
        message: "Your account has been suspended.",
      });
    if (err.message === "ACCOUNT_BANNED")
      return reply.status(403).send({
        success: false,
        message: "Your account has been permanently banned.",
      });
    return reply
      .status(401)
      .send({
        success: false,
        message: "Session expired — please log in again",
      });
  }
}
// ── Logout ─────────────────────────────────────────────────
export async function logoutController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  reply
    .clearCookie(COOKIE_ACCESS, { path: "/" })
    .clearCookie(COOKIE_REFRESH, { path: "/" });
  return reply.send({ success: true, message: "Logged out successfully" });
}
// ── Verify Email ───────────────────────────────────────────
export async function verifyEmailController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = verifyEmailSchema.safeParse(req.body);
  if (!body.success)
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });
  try {
    await verifyEmail(body.data.token);
    return reply.send({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (err: any) {
    if (err.message === "INVALID_TOKEN")
      return reply.status(400).send({
        success: false,
        message: "Invalid or expired verification token",
      });
    if (err.message === "TOKEN_EXPIRED")
      return reply.status(400).send({
        success: false,
        message:
          "Verification token has expired. Please request a new one.",
      });
    if (err.message === "ALREADY_VERIFIED")
      return reply
        .status(409)
        .send({ success: false, message: "Email is already verified" });
    if (err.message === "NOT_FOUND")
      return reply
        .status(404)
        .send({ success: false, message: "User not found" });
    throw err;
  }
}
// ── Resend Verification Email ──────────────────────────────
export async function resendVerificationController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = resendVerificationSchema.safeParse(req.body);
  if (!body.success)
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });
  try {
    await resendVerificationEmail(body.data.email);
    return reply.send({
      success: true,
      message:
        "If this email is registered and unverified, a new verification link has been sent.",
    });
  } catch (err: any) {
    if (err.message === "ALREADY_VERIFIED")
      return reply
        .status(409)
        .send({ success: false, message: "Email is already verified" });
    if (err.message === "ACCOUNT_BANNED")
      return reply.status(403).send({
        success: false,
        message: "Your account has been permanently banned.",
      });
    // NOT_FOUND — silently succeed to not leak whether email is registered
    return reply.send({
      success: true,
      message:
        "If this email is registered and unverified, a new verification link has been sent.",
    });
  }
}
// ── Forgot Password ────────────────────────────────────────
export async function forgotPasswordController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = forgotPasswordSchema.safeParse(req.body);
  if (!body.success)
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });
  // Always return the same generic response — never reveal whether email exists
  await forgotPassword(body.data);
  return reply.send({
    success: true,
    message:
      "If this email is registered, a password reset link has been sent.",
  });
}
// ── Reset Password ─────────────────────────────────────────
export async function resetPasswordController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = resetPasswordSchema.safeParse(req.body);
  if (!body.success)
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });
  try {
    await resetPassword(body.data);
    return reply.send({
      success: true,
      message:
        "Password reset successfully. Please log in with your new password.",
    });
  } catch (err: any) {
    if (err.message === "INVALID_TOKEN")
      return reply.status(400).send({
        success: false,
        message: "Invalid or expired reset token",
      });
    if (err.message === "TOKEN_EXPIRED")
      return reply.status(400).send({
        success: false,
        message:
          "Reset token has expired. Please request a new password reset.",
      });
    if (err.message === "ACCOUNT_BANNED")
      return reply.status(403).send({
        success: false,
        message: "Your account has been permanently banned.",
      });
    if (err.message === "NOT_FOUND")
      return reply
        .status(404)
        .send({ success: false, message: "User not found" });
    throw err;
  }
}
// ── Get Me ─────────────────────────────────────────────────
export async function getMeController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    
    const user = await getUserProfile(req.user!.userId);
    return reply.send({ success: true, data: user });
  } catch (err: any) {
    
    
    
    if (err.message === "ACCOUNT_SUSPENDED") {
      reply
        .clearCookie(COOKIE_ACCESS, { path: "/" })
        .clearCookie(COOKIE_REFRESH, { path: "/" });
      return reply.status(403).send({
        success: false,
        message: "Your account has been suspended.",
      });
    }
    if (err.message === "ACCOUNT_BANNED") {
      reply
        .clearCookie(COOKIE_ACCESS, { path: "/" })
        .clearCookie(COOKIE_REFRESH, { path: "/" });
      return reply.status(403).send({
        success: false,
        message: "Your account has been permanently banned.",
      });
    }
    return reply
      .status(404)
      .send({ success: false, message: "User not found" });
  }
}
// ── Update Me (multipart — avatar optional) ────────────────
//
// Mirrors admin.controller.ts:updateMeController exactly:
//   1. parseMultipart with avatar field rule (maxCount: 1, required: false)
//   2. Safeprase scalar fields from multipart fields
//   3. Build UploadInput from ParsedFile if present
//   4. Call service — which handles replace vs create internally
//   5. Return updated user with avatar
export async function updateMeController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  let fields: Record<string, any>;
  let file: import("../../utils/parse-multipart.js").ParsedFile | undefined;
  try {
    const parsed = await parseMultipart(req, {
      allowedFileFields: {
        avatar: {
          folder: CLD_FOLDERS.USER_AVATARS,
          maxCount: 1,
          required: false,
        },
      },
    });
    fields = parsed.fields;
    file = parsed.file;
  } catch (err) {
    if (err instanceof MultipartValidationError) {
      return reply.status(400).send({
        success: false,
        message: err.message,
        field: err.field,
      });
    }
    throw err;
  }
  const body = updateProfileSchema.safeParse(fields);
  if (!body.success)
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });
  // Build UploadInput from the ParsedFile if the caller sent an avatar
  const avatarUpload = file
    ? {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalFilename: file.filename,
        folder: CLD_FOLDERS.USER_AVATARS,
        size: file.size,
      }
    : undefined;
  try {
    const user = await updateUserProfile(
      req.user!.userId,
      body.data,
      avatarUpload,
    );
    return reply.send({ success: true, data: user });
  } catch (err: any) {
    if (err.message === "NOT_FOUND")
      return reply
        .status(404)
        .send({ success: false, message: "User not found" });
    throw err;
  }
}
// ── Change Password (authenticated) ───────────────────────
export async function changePasswordController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = changePasswordSchema.safeParse(req.body);
  if (!body.success)
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });
  try {
    await changeUserPassword(req.user!.userId, body.data);
    // Force re-login after password change (invalidate existing sessions)
    reply
      .clearCookie(COOKIE_ACCESS, { path: "/" })
      .clearCookie(COOKIE_REFRESH, { path: "/" });
    return reply.send({
      success: true,
      message: "Password changed successfully — please log in again.",
    });
  } catch (err: any) {
    if (err.message === "WRONG_PASSWORD")
      return reply.status(400).send({
        success: false,
        message: "Current password is incorrect",
      });
    if (err.message === "NOT_FOUND")
      return reply
        .status(404)
        .send({ success: false, message: "User not found" });
    throw err;
  }
}
