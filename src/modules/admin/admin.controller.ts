import { FastifyRequest, FastifyReply } from "fastify";
import {
  registerSchema,
  loginSchema,
  updateAdminSchema,
  changePasswordSchema,
  adminQuerySchema,
} from "./admin.schema.js";
import {
  registerAdmin,
  loginAdmin,
  refreshAdminToken,
  getAdminProfile,
  changeOwnPassword,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
} from "./admin.service.js";
import {
  accessCookieOptions,
  refreshCookieOptions,
} from "./admin.middleware.js";
import { env } from "../../config/env.js";
import { parseMultipart } from "../../utils/parse-multipart.js";

const COOKIE_ACCESS = env.ADMIN_COOKIE_ACCESS_NAME!;
const COOKIE_REFRESH = env.ADMIN_COOKIE_REFRESH_NAME!;

// ── Shared param type — used inline in route, not in handler ──
export type IdParams = { Params: { id: string } };

// ── Auth ───────────────────────────────────────────────────

export async function loginController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = loginSchema.safeParse(req.body);
  if (!body.success)
    return reply
      .status(400)
      .send({ success: false, errors: body.error.flatten().fieldErrors });

  try {
    const { admin, tokens } = await loginAdmin(body.data);
    reply
      .setCookie(COOKIE_ACCESS, tokens.accessToken, accessCookieOptions)
      .setCookie(COOKIE_REFRESH, tokens.refreshToken, refreshCookieOptions);
    return reply
      .status(200)
      .send({ success: true, message: "Login successful", data: { admin } });
  } catch (err: any) {
    if (err.message === "ACCOUNT_SUSPENDED") {
      return reply.status(401).send({
        success: false,
        message: "Your account has been suspended. Please contact support.",
      });
    }
    if (err.message === "INVALID_CREDENTIALS") {
      return reply.status(401).send({
        success: false,
        message: "Invalid email or password",
        error: err.message,
      });
    }
    return reply.status(401).send({
      success: false,
      message: "An error occurred while logging in",
      error: err.message,
    });
  }
}

export async function refreshController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const refreshToken = req.cookies?.[COOKIE_REFRESH];
  if (!refreshToken)
    return reply
      .status(401)
      .send({ success: false, message: "No refresh token" });

  try {
    const tokens = await refreshAdminToken(refreshToken);
    reply.setCookie(COOKIE_ACCESS, tokens.accessToken, accessCookieOptions);
    return reply.send({ success: true, message: "Session refreshed" });
  } catch {
    reply
      .clearCookie(COOKIE_ACCESS, { path: accessCookieOptions.path })
      .clearCookie(COOKIE_REFRESH, { path: refreshCookieOptions.path });
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
    .clearCookie(COOKIE_ACCESS, { path: accessCookieOptions.path })
    .clearCookie(COOKIE_REFRESH, { path: refreshCookieOptions.path });
  return reply.send({ success: true, message: "Logged out" });
}

export async function profileController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const admin = await getAdminProfile(req.admin!.adminId);
    return reply.send({ success: true, data: admin });
  } catch (err: any) {
    if (err.message === "ACCOUNT_SUSPENDED") {
      reply
        .clearCookie(COOKIE_ACCESS, { path: accessCookieOptions.path })
        .clearCookie(COOKIE_REFRESH, { path: refreshCookieOptions.path });
      return reply.status(401).send({
        success: false,
        message: "Your account is inactive. Please contact your supervisor.",
      });
    }
    return reply
      .status(404)
      .send({ success: false, message: "Admin not found" });
  }
}

export async function updateProfileController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const { fields, file } = await parseMultipart(req);
  const body = updateAdminSchema.safeParse(fields);
  if (!body.success)
    return reply
      .status(400)
      .send({ success: false, errors: body.error.flatten().fieldErrors });

  try {
    const admin = await updateAdmin(
      req.admin!.adminId,
      body.data,
      req.admin!.role,
      file,
    );
    return reply.send({ success: true, data: admin });
  } catch (err: any) {
    if (err.message === "NOT_FOUND")
      return reply
        .status(404)
        .send({ success: false, message: "Admin not found" });
    throw err;
  }
}

export async function changePasswordController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = changePasswordSchema.safeParse(req.body);
  if (!body.success)
    return reply
      .status(400)
      .send({ success: false, errors: body.error.flatten().fieldErrors });

  try {
    await changeOwnPassword(req.admin!.adminId, body.data);
    reply
      .clearCookie(COOKIE_ACCESS, { path: accessCookieOptions.path })
      .clearCookie(COOKIE_REFRESH, { path: refreshCookieOptions.path });
    return reply.send({
      success: true,
      message: "Password changed — please log in again",
    });
  } catch (err: any) {
    if (err.message === "WRONG_PASSWORD")
      return reply
        .status(400)
        .send({ success: false, message: "Current password is incorrect" });
    throw err;
  }
}

// ── Admin Management ───────────────────────────────────────

export async function registerController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const { fields, file } = await parseMultipart(req);
  const body = registerSchema.safeParse(fields);
  if (!body.success)
    return reply
      .status(400)
      .send({ success: false, errors: body.error.flatten().fieldErrors });

  try {
    const admin = await registerAdmin(body.data, file);
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

export async function getAdminsController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const query = adminQuerySchema.safeParse(req.query);
  if (!query.success)
    return reply
      .status(400)
      .send({ success: false, errors: query.error.flatten().fieldErrors });

  const result = await getAdmins(query.data);
  return reply.send({ success: true, ...result });
}

// ── Params read from req.params directly — no generic needed on handler ──

export async function getAdminByIdController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const id = Number((req.params as { id: string }).id);
  try {
    const admin = await getAdminById(id);
    return reply.send({ success: true, data: admin });
  } catch {
    return reply
      .status(404)
      .send({ success: false, message: "Admin not found" });
  }
}

export async function updateAdminController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const id = Number((req.params as { id: string }).id);
  const { fields, file } = await parseMultipart(req);
  const body = updateAdminSchema.safeParse(fields);
  if (!body.success)
    return reply
      .status(400)
      .send({ success: false, errors: body.error.flatten().fieldErrors });

  try {
    const admin = await updateAdmin(id, body.data, req.admin!.role, file);
    return reply.send({ success: true, data: admin });
  } catch (err: any) {
    if (err.message === "NOT_FOUND")
      return reply
        .status(404)
        .send({ success: false, message: "Admin not found" });
    if (err.message === "FORBIDDEN")
      return reply.status(403).send({ success: false, message: "Forbidden" });
    if (err.message === "CANNOT_CHANGE_ROLE")
      return reply
        .status(403)
        .send({ success: false, message: "Only Super Admin can change roles" });
    throw err;
  }
}

export async function deleteAdminController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const id = Number((req.params as { id: string }).id);
  try {
    await deleteAdmin(id, req.admin!.adminId);
    return reply.send({ success: true, message: "Admin deleted" });
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
