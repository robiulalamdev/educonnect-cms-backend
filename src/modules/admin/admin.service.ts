import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import {
  RegisterInput,
  LoginInput,
  UpdateAdminInput,
  ChangePasswordInput,
  AdminQueryInput,
} from "./admin.schema.js";
import { IAdminRole } from "./admin.types.js";
import { uploadToR2, deleteFromR2 } from "../../utils/cloudflare-upload.js";
import { CF_FOLDERS } from "../../config/cloudflare.js";

const ACCESS_SECRET = env.ADMIN_JWT_ACCESS_SECRET;
const REFRESH_SECRET = env.ADMIN_JWT_REFRESH_SECRET;

export type JwtPayload = {
  adminId: number;
  email: string;
  role: IAdminRole;
};

export function generateAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: env.ADMIN_JWT_ACCESS_EXPIRES,
  } as SignOptions);
}

export function generateTokens(payload: JwtPayload) {
  const accessToken = generateAccessToken(payload);

  const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: env.ADMIN_JWT_REFRESH_EXPIRES,
  } as SignOptions);

  return { accessToken, refreshToken };
}

const safeAdminSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
};

// ── Auth ───────────────────────────────────────────────────

export async function registerAdmin(
  input: RegisterInput,
  avatarFile?: { buffer: Buffer; mimetype: string },
) {
  const existing = await prisma.admin.findUnique({
    where: { email: input.email },
  });
  if (existing) throw new Error("EMAIL_TAKEN");

  let avatarUrl = input.avatarUrl;
  if (avatarFile) {
    const uploaded = await uploadToR2(
      avatarFile.buffer,
      avatarFile.mimetype,
      CF_FOLDERS.ADMIN_AVATARS,
    );
    avatarUrl = uploaded.key;
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.admin.create({
    data: {
      name: input.name,
      email: input.email,
      password: passwordHash,
      role: input.role,
      isActive: input.isActive ?? true,
      avatarUrl,
    },
    select: safeAdminSelect,
  });
}

export async function loginAdmin(input: LoginInput) {
  const admin = await prisma.admin.findUnique({
    where: { email: input.email },
  });

  if (!admin) throw new Error("INVALID_CREDENTIALS");

  if (!admin.isActive) throw new Error("ACCOUNT_SUSPENDED");

  const valid = await bcrypt.compare(input.password, admin.password);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  const tokens = generateTokens({
    adminId: admin.id,
    email: admin.email,
    role: admin.role as IAdminRole,
  });

  return {
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    tokens,
  };
}

export async function refreshAdminToken(refreshToken: string) {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(refreshToken, REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: payload.adminId },
  });
  if (!admin || !admin.isActive) throw new Error("INVALID_REFRESH_TOKEN");

  return generateTokens({
    adminId: admin.id,
    email: admin.email,
    role: admin.role as IAdminRole,
  });
}

// ── Profile ────────────────────────────────────────────────

export async function getAdminProfile(adminId: number) {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: safeAdminSelect,
  });
  if (!admin) throw new Error("NOT_FOUND");
  if (!admin.isActive) throw new Error("ACCOUNT_SUSPENDED");
  return admin;
}

export async function changeOwnPassword(
  adminId: number,
  input: ChangePasswordInput,
) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) throw new Error("NOT_FOUND");

  const valid = await bcrypt.compare(input.currentPassword, admin.password);
  if (!valid) throw new Error("WRONG_PASSWORD");

  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.admin.update({
    where: { id: adminId },
    data: { password: passwordHash },
  });
}

// ── Admin Management (SUPER_ADMIN + ADMIN) ─────────────────

export async function getAdmins(query: AdminQueryInput) {
  const { page, limit, search, role, isActive } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(role && { role }),
    ...(isActive !== undefined && { isActive }),
  };

  const [admins, total] = await Promise.all([
    prisma.admin.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: safeAdminSelect,
    }),
    prisma.admin.count({ where }),
  ]);

  return {
    data: admins,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAdminById(id: number) {
  const admin = await prisma.admin.findUnique({
    where: { id },
    select: safeAdminSelect,
  });
  if (!admin) throw new Error("NOT_FOUND");
  return admin;
}

export async function updateAdmin(
  targetId: number,
  input: UpdateAdminInput,
  requestorRole: IAdminRole,
  avatarFile?: { buffer: Buffer; mimetype: string },
) {
  const target = await prisma.admin.findUnique({ where: { id: targetId } });
  if (!target) throw new Error("NOT_FOUND");

  // Only SUPER_ADMIN can change roles
  if (input.role && requestorRole !== "SUPER_ADMIN") {
    throw new Error("CANNOT_CHANGE_ROLE");
  }

  // ADMIN cannot edit another SUPER_ADMIN
  if (requestorRole === "ADMIN" && target.role === "SUPER_ADMIN") {
    throw new Error("FORBIDDEN");
  }

  let avatarUrl = target.avatarUrl;
  if (avatarFile) {
    // Delete old avatar from R2 if it exists (it's stored as a key)
    if (target.avatarUrl) {
      await deleteFromR2(target.avatarUrl).catch(() => {});
    }
    const uploaded = await uploadToR2(
      avatarFile.buffer,
      avatarFile.mimetype,
      CF_FOLDERS.ADMIN_AVATARS,
    );
    avatarUrl = uploaded.key;
  }

  const data: any = { ...input };
  if (avatarUrl !== target.avatarUrl) {
    data.avatarUrl = avatarUrl;
  }

  return prisma.admin.update({
    where: { id: targetId },
    data,
    select: safeAdminSelect,
  });
}

export async function deleteAdmin(targetId: number, requestorId: number) {
  const target = await prisma.admin.findUnique({ where: { id: targetId } });
  if (!target) throw new Error("NOT_FOUND");

  // Cannot delete yourself
  if (targetId === requestorId) throw new Error("CANNOT_DELETE_SELF");

  return prisma.admin.delete({ where: { id: targetId } });
}
