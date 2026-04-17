import { FastifyRequest, FastifyReply } from "fastify";
import {
  loginAdminSchema,
  registerAdminSchema,
  changePasswordSchema,
  updateOwnProfileSchema,
  updateAdminSchema,
  adminListQuerySchema,
  auditLogQuerySchema,
} from "./admin.schema.js";
import {
  loginAdmin,
  refreshAdminToken,
  getAdminProfile,
  updateOwnProfile,
  changeOwnPassword,
  registerAdmin,
  getAdminList,
  getAdminById,
  updateAdminById,
  deleteAdminById,
} from "./admin.service.js";
import { getAuditLogs } from "./audit.service.js";
import {
  adminAccessCookieOptions,
  adminRefreshCookieOptions,
} from "./admin.middleware.js";
import { env } from "../../config/env.js";
import { parseMultipart } from "../../utils/parse-multipart.js";
import { CLD_FOLDERS } from "../../config/cloudinary.js";

const COOKIE_ACCESS = env.ADMIN_COOKIE_ACCESS_NAME;
const COOKIE_REFRESH = env.ADMIN_COOKIE_REFRESH_NAME;

// ── Auth ───────────────────────────────────────────────────

export async function loginController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = loginAdminSchema.safeParse(req.body);
  if (!body.success)
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });

  try {
    const { admin, tokens } = await loginAdmin(body.data);

    reply
      .setCookie(COOKIE_ACCESS, tokens.accessToken, adminAccessCookieOptions)
      .setCookie(COOKIE_REFRESH, tokens.refreshToken, adminRefreshCookieOptions);

    return reply.status(200).send({
      success: true,
      message: "Login successful",
      data: { admin },
    });
  } catch (err: any) {
    if (err.message === "ACCOUNT_NOT_FOUND")
      return reply.status(404).send({
        success: false,
        message: "Account not found",
      });
    if (err.message === "ACCOUNT_SUSPENDED")
      return reply.status(403).send({
        success: false,
        message: "Your account is inactive. Contact your supervisor.",
      });

    if (err.message === "INVALID_CREDENTIALS")
      return reply.status(401).send({
        success: false,
        message: "Invalid email or password",
      });

    throw err;
  }
}

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
    const tokens = await refreshAdminToken(refreshToken);
    reply.setCookie(COOKIE_ACCESS, tokens.accessToken, adminAccessCookieOptions);
    return reply.send({ success: true, message: "Session refreshed" });
  } catch {
    reply
      .clearCookie(COOKIE_ACCESS, { path: "/" })
      .clearCookie(COOKIE_REFRESH, { path: "/" });
    return reply.status(401).send({
      success: false,
      message: "Session expired — please log in again",
    });
  }
}

export async function logoutController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  reply
    .clearCookie(COOKIE_ACCESS, { path: "/" })
    .clearCookie(COOKIE_REFRESH, { path: "/" });
  return reply.send({ success: true, message: "Logged out successfully" });
}

// ── Own Profile ────────────────────────────────────────────

export async function getMeController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const admin = await getAdminProfile(req.admin!.adminId);
    return reply.send({ success: true, data: admin });
  } catch (err: any) {
    if (err.message === "ACCOUNT_SUSPENDED") {
      reply
        .clearCookie(COOKIE_ACCESS, { path: "/" })
        .clearCookie(COOKIE_REFRESH, { path: "/" });
      return reply.status(403).send({
        success: false,
        message: "Your account is inactive.",
      });
    }
    return reply
      .status(404)
      .send({ success: false, message: "Admin not found" });
  }
}

export async function updateMeController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const { fields, file } = await parseMultipart(req, {
    allowedFileFields: {
      avatar: {
        folder: CLD_FOLDERS.ADMIN_AVATARS,
        maxCount: 1,
        required: false,
      },
    },
  });

  const body = updateOwnProfileSchema.safeParse(fields);
  if (!body.success)
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });

  // build upload input if file provided
  const avatarUpload = file
    ? {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalFilename: file.filename,
        folder: CLD_FOLDERS.ADMIN_AVATARS,
        size: file.buffer.length,
      }
    : undefined;

  try {
    const admin = await updateOwnProfile(
      req.admin!.adminId,
      body.data,
      avatarUpload,
    );
    return reply.send({ success: true, data: admin });
  } catch (err: any) {
    if (err.message === "EMAIL_TAKEN")
      return reply
        .status(409)
        .send({ success: false, message: "Email already in use" });
    throw err;
  }
}

export async function changePasswordController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = changePasswordSchema.safeParse(req.body);

  if (!body.success)
    return reply.status(400).send({
      success: false,
      message: "Validation failed",
      errors: body.error.flatten().fieldErrors,
    });

  try {
    await changeOwnPassword(req.admin!.adminId, body.data);

    // force re-login after password change
    reply
      .clearCookie(COOKIE_ACCESS, { path: "/" })
      .clearCookie(COOKIE_REFRESH, { path: "/" });

    return reply.send({
      success: true,
      message: "Password changed — please log in again",
    });
  } catch (err: any) {
    if (err.message === "WRONG_PASSWORD")
      return reply.status(400).send({
        success: false,
        message: "Current password is incorrect",
      });
    throw err;
  }
}

// ── Admin Management ───────────────────────────────────────

export async function registerAdminController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const { fields, file } = await parseMultipart(req, {
    allowedFileFields: {
      avatar: {
        folder: CLD_FOLDERS.ADMIN_AVATARS,
        maxCount: 1,
        required: false,
      },
    },
  });

  const body = registerAdminSchema.safeParse(fields);
  if (!body.success)
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });

  const avatarUpload = file
    ? {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalFilename: file.filename,
        folder: CLD_FOLDERS.ADMIN_AVATARS,
        size: file.buffer.length,
      }
    : undefined;

  try {
    const admin = await registerAdmin(req.admin!.adminId, body.data, avatarUpload);
    return reply.status(201).send({
      success: true,
      message: "Admin registered successfully",
      data: admin,
    });
  } catch (err: any) {
    if (err.message === "EMAIL_TAKEN")
      return reply
        .status(409)
        .send({ success: false, message: "Email already in use" });
    throw err;
  }
}

export async function getAdminListController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const query = adminListQuerySchema.safeParse(req.query);
  if (!query.success)
    return reply.status(400).send({
      success: false,
      errors: query.error.flatten().fieldErrors,
    });

  const result = await getAdminList(query.data);
  return reply.send({ success: true, ...result });
}

export async function getAdminByIdController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = req.params as { id: string };

  try {
    const admin = await getAdminById(id);
    return reply.send({ success: true, data: admin });
  } catch {
    return reply
      .status(404)
      .send({ success: false, message: "Admin not found" });
  }
}


export async function getAuditLogsController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const query = auditLogQuerySchema.safeParse(req.query);
  if (!query.success)
    return reply.status(400).send({
      success: false,
      errors: query.error.flatten().fieldErrors,
    });

  const result = await getAuditLogs(query.data);
  return reply.send({ success: true, ...result });
}

export async function updateAdminController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = req.params as { id: string };
  const { fields, file } = await parseMultipart(req, {
    allowedFileFields: {
      avatar: {
        folder: CLD_FOLDERS.ADMIN_AVATARS,
        maxCount: 1,
        required: false,
      },
    },
  });

  const body = updateAdminSchema.safeParse(fields);
  if (!body.success)
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });

  const avatarUpload = file
    ? {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalFilename: file.filename,
        folder: CLD_FOLDERS.ADMIN_AVATARS,
        size: file.buffer.length,
      }
    : undefined;

  try {
    const admin = await updateAdminById(
      id,
      req.admin!.adminId,
      req.admin!.role,
      body.data,
      avatarUpload,
    );
    return reply.send({ success: true, data: admin });
  } catch (err: any) {
    if (err.message === "NOT_FOUND")
      return reply
        .status(404)
        .send({ success: false, message: "Admin not found" });
    if (err.message === "USE_PROFILE_ENDPOINT")
      return reply.status(400).send({
        success: false,
        message: "Use /me endpoints to edit your own profile",
      });
    if (err.message === "FORBIDDEN")
      return reply.status(403).send({ success: false, message: "Forbidden" });
    if (err.message === "CANNOT_CHANGE_ROLE")
      return reply.status(403).send({
        success: false,
        message: "Only Super Admin can change roles",
      });
    throw err;
  }
}

export async function deleteAdminController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = req.params as { id: string };

  try {
    await deleteAdminById(id, req.admin!.adminId);
    return reply.send({ success: true, message: "Admin deleted successfully" });
  } catch (err: any) {
    if (err.message === "NOT_FOUND")
      return reply
        .status(404)
        .send({ success: false, message: "Admin not found" });
    if (err.message === "CANNOT_DELETE_SELF")
      return reply.status(400).send({
        success: false,
        message: "You cannot delete your own account",
      });
    throw err;
  }
}
