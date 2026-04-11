import bcrypt from "bcryptjs";
import { EncryptJWT, jwtDecrypt } from "jose";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { IAdminRole } from "./admin.types.js";
import {
  RegisterAdminInput,
  LoginAdminInput,
  ChangePasswordInput,
  UpdateOwnProfileInput,
  UpdateAdminInput,
  AdminListQueryInput,
} from "./admin.schema.js";
import {
  uploadToCloudinary,
  replaceInCloudinary,
  deleteFromCloudinary,
} from "../../utils/cloudinary-upload.js";
import type { UploadInput } from "../../utils/cloudinary-upload.js";

// ── JWT Secrets ────────────────────────────────────────────

const accessSecret = new TextEncoder().encode(env.ADMIN_JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.ADMIN_JWT_REFRESH_SECRET);

// ── JWT Payload ────────────────────────────────────────────

export type JwtPayload = {
  adminId: string; // cuid string — was number before
  email: string;
  role: IAdminRole;
};

// ── Token Generators ───────────────────────────────────────

export async function generateAccessToken(
  payload: JwtPayload,
): Promise<string> {
  return new EncryptJWT({ ...payload })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(env.ADMIN_JWT_ACCESS_EXPIRES)
    .encrypt(accessSecret);
}

export async function generateTokens(
  payload: JwtPayload,
): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    new EncryptJWT({ ...payload })
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .setIssuedAt()
      .setExpirationTime(env.ADMIN_JWT_ACCESS_EXPIRES)
      .encrypt(accessSecret),

    new EncryptJWT({ ...payload })
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .setIssuedAt()
      .setExpirationTime(env.ADMIN_JWT_REFRESH_EXPIRES)
      .encrypt(refreshSecret),
  ]);

  return { accessToken, refreshToken };
}

export async function refreshAdminToken(refreshToken: string) {
  let payload: JwtPayload;

  try {
    const { payload: decrypted } = await jwtDecrypt(
      refreshToken,
      refreshSecret,
    );
    payload = decrypted as unknown as JwtPayload;
  } catch {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: payload.adminId },
  });

  if (!admin || admin.status === "INACTIVE") {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  return generateTokens({
    adminId: admin.id,
    email: admin.email,
    role: admin.role as IAdminRole,
  });
}

// ── Safe select — never expose password ───────────────────

const safeAdminSelect = {
  id: true,
  full_name: true,
  email: true,
  role: true,
  status: true,
  avatar_url: true,
  last_login: true,
  created_at: true,
  updated_at: true,
} as const;

// ── Auth ───────────────────────────────────────────────────

export async function loginAdmin(input: LoginAdminInput) {
  const admin = await prisma.admin.findUnique({
    where: { email: input.email },
  });

  if (!admin) throw new Error("INVALID_CREDENTIALS");
  if (admin.status === "INACTIVE") throw new Error("ACCOUNT_SUSPENDED");

  const valid = await bcrypt.compare(input.password, admin.password);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  // update last_login
  await prisma.admin.update({
    where: { id: admin.id },
    data: { last_login: new Date() },
  });

  const tokens = await generateTokens({
    adminId: admin.id,
    email: admin.email,
    role: admin.role as IAdminRole,
  });

  return {
    admin: {
      id: admin.id,
      full_name: admin.full_name,
      email: admin.email,
      role: admin.role,
      status: admin.status,
    },
    tokens,
  };
}

// ── Own Profile ────────────────────────────────────────────

export async function getAdminProfile(adminId: string) {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: safeAdminSelect,
  });

  if (!admin) throw new Error("NOT_FOUND");
  if (admin.status === "INACTIVE") throw new Error("ACCOUNT_SUSPENDED");

  return admin;
}

export async function updateOwnProfile(
  adminId: string,
  input: UpdateOwnProfileInput,
  avatarFile?: UploadInput,
) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) throw new Error("NOT_FOUND");

  // check email uniqueness if changing
  if (input.email && input.email !== admin.email) {
    const taken = await prisma.admin.findUnique({
      where: { email: input.email },
    });
    if (taken) throw new Error("EMAIL_TAKEN");
  }

  let avatar_url = admin.avatar_url;

  if (avatarFile) {
    if (admin.avatar_url) {
      // replace old avatar
      const result = await replaceInCloudinary(
        admin.avatar_url,
        "image/jpeg", // stored mimetype fallback
        avatarFile,
      );
      avatar_url = result.public_id;
    } else {
      const result = await uploadToCloudinary(avatarFile);
      avatar_url = result.public_id;
    }
  }

  return prisma.admin.update({
    where: { id: adminId },
    data: { ...input, avatar_url },
    select: safeAdminSelect,
  });
}

export async function changeOwnPassword(
  adminId: string,
  input: ChangePasswordInput,
) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) throw new Error("NOT_FOUND");

  const valid = await bcrypt.compare(input.current_password, admin.password);
  if (!valid) throw new Error("WRONG_PASSWORD");

  const hashed = await bcrypt.hash(input.new_password, 12);

  await prisma.admin.update({
    where: { id: adminId },
    data: { password: hashed },
  });
}

// ── Admin Management ───────────────────────────────────────

export async function registerAdmin(
  input: RegisterAdminInput,
  avatarFile?: UploadInput,
) {
  const existing = await prisma.admin.findUnique({
    where: { email: input.email },
  });
  if (existing) throw new Error("EMAIL_TAKEN");

  let avatar_url: string | undefined;

  if (avatarFile) {
    const result = await uploadToCloudinary(avatarFile);
    avatar_url = result.public_id;
  }

  const hashed = await bcrypt.hash(input.password, 12);

  return prisma.admin.create({
    data: {
      full_name: input.full_name,
      email: input.email,
      password: hashed,
      role: input.role,
      avatar_url,
    },
    select: safeAdminSelect,
  });
}

export async function getAdminList(query: AdminListQueryInput) {
  const { page, limit, search, role, status } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(search && {
      OR: [
        { full_name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(role && { role }),
    ...(status && { status }),
  };

  const [admins, total] = await Promise.all([
    prisma.admin.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
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
      total_pages: Math.ceil(total / limit),
      has_next: page < Math.ceil(total / limit),
    },
  };
}

export async function getAdminById(id: string) {
  const admin = await prisma.admin.findUnique({
    where: { id },
    select: safeAdminSelect,
  });
  if (!admin) throw new Error("NOT_FOUND");
  return admin;
}

export async function updateAdminById(
  targetId: string,
  requestorId: string,
  requestorRole: IAdminRole,
  input: UpdateAdminInput,
  avatarFile?: UploadInput,
) {
  const target = await prisma.admin.findUnique({ where: { id: targetId } });
  if (!target) throw new Error("NOT_FOUND");

  // cannot edit yourself through this endpoint — use /me routes
  if (targetId === requestorId) throw new Error("USE_PROFILE_ENDPOINT");

  // only SUPER_ADMIN can change roles
  if (input.role && requestorRole !== "SUPER_ADMIN") {
    throw new Error("CANNOT_CHANGE_ROLE");
  }

  // ADMIN cannot edit a SUPER_ADMIN
  if (requestorRole === "ADMIN" && target.role === "SUPER_ADMIN") {
    throw new Error("FORBIDDEN");
  }

  let avatar_url = target.avatar_url;

  if (avatarFile) {
    if (target.avatar_url) {
      const result = await replaceInCloudinary(
        target.avatar_url,
        "image/jpeg",
        avatarFile,
      );
      avatar_url = result.public_id;
    } else {
      const result = await uploadToCloudinary(avatarFile);
      avatar_url = result.public_id;
    }
  }

  return prisma.admin.update({
    where: { id: targetId },
    data: { ...input, avatar_url },
    select: safeAdminSelect,
  });
}

export async function deleteAdminById(targetId: string, requestorId: string) {
  const target = await prisma.admin.findUnique({ where: { id: targetId } });
  if (!target) throw new Error("NOT_FOUND");

  if (targetId === requestorId) throw new Error("CANNOT_DELETE_SELF");

  // cleanup avatar from cloudinary
  if (target.avatar_url) {
    await deleteFromCloudinary(target.avatar_url, "image/jpeg").catch(() => {});
  }

  await prisma.admin.delete({ where: { id: targetId } });
}
