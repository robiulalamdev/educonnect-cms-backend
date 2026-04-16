import bcrypt from "bcryptjs";
import { EncryptJWT, jwtDecrypt } from "jose";
import { prisma } from "../../config/prisma.js";
import { IAdminRole } from "./admin.types.js";
import {
  RegisterAdminInput,
  LoginAdminInput,
  ChangePasswordInput,
  UpdateOwnProfileInput,
  UpdateAdminInput,
  AdminListQueryInput,
} from "./admin.schema.js";
import { createAuditLog } from "./audit.service.js";
import { AUDIT_ACTION_OBJECT } from "./admin.types.js";
import {
  uploadToCloudinary,
  replaceInCloudinary,
  deleteFromCloudinary,
} from "../../utils/cloudinary-upload.js";
import type { UploadInput } from "../../utils/cloudinary-upload.js";

// ── JWT Secrets ────────────────────────────────────────────
import { jwtConfig } from "../../config/jwt.js";

// ── JWT Payload ────────────────────────────────────────────

export type JwtPayload = {
  adminId: string;
  email: string;
  role: IAdminRole;
};

// ── Token Generators ───────────────────────────────────────

export async function generateAdminAccessToken(
  payload: JwtPayload,
): Promise<string> {
  return new EncryptJWT({ ...payload })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(jwtConfig.admin.expires.access)
    .encrypt(jwtConfig.admin.accessSecret);
}

export async function generateAdminTokens(
  payload: JwtPayload,
): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    new EncryptJWT({ ...payload })
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .setIssuedAt()
      .setExpirationTime(jwtConfig.admin.expires.access)
      .encrypt(jwtConfig.admin.accessSecret),

    new EncryptJWT({ ...payload })
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .setIssuedAt()
      .setExpirationTime(jwtConfig.admin.expires.refresh)
      .encrypt(jwtConfig.admin.refreshSecret),
  ]);

  return { accessToken, refreshToken };
}

export async function refreshAdminToken(refreshToken: string) {
  let payload: JwtPayload;

  try {
    const { payload: decrypted } = await jwtDecrypt(
      refreshToken,
      jwtConfig.admin.refreshSecret,
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

  return generateAdminTokens({
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
  last_login: true,
  created_at: true,
  updated_at: true,
  avatar: {
    select: {
      id: true,
      url: true,
      key: true, // public_id — used for Cloudinary delete/replace
      mime_type: true,
      size: true,
    },
  },
} as const;

// ── Avatar helper — upload and create Media record ────────

async function uploadAvatar(
  adminId: string,
  avatarFile: UploadInput,
  existingAvatar?: { id: string; key: string; mime_type: string } | null,
) {
  if (existingAvatar) {
    // upload new → delete old from Cloudinary
    const result = await replaceInCloudinary(
      existingAvatar.key,
      existingAvatar.mime_type,
      avatarFile,
    );

    // update existing Media record in place
    await prisma.media.update({
      where: { id: existingAvatar.id },
      data: {
        url: result.url,
        key: result.public_id,
        mime_type: result.mimetype,
        size: result.size,
      },
    });

    // avatar_id stays the same — no need to update Admin row
    return;
  }

  // no existing avatar — upload and create new Media record
  const result = await uploadToCloudinary(avatarFile);

  const media = await prisma.media.create({
    data: {
      url: result.url,
      key: result.public_id,
      filename: result.filename,
      mime_type: result.mimetype,
      size: result.size,
      type: "IMAGE",
      owner_type: "ADMIN",
      owner_id: adminId,
    },
  });

  // link Media to Admin
  await prisma.admin.update({
    where: { id: adminId },
    data: { avatar_id: media.id },
  });
}

// ── Auth ───────────────────────────────────────────────────

export async function loginAdmin(input: LoginAdminInput) {
  const admin = await prisma.admin.findUnique({
    where: { email: input.email },
  });

  if (!admin) throw new Error("ACCOUNT_NOT_FOUND");
  if (admin.status === "INACTIVE") throw new Error("ACCOUNT_SUSPENDED");

  const valid = await bcrypt.compare(input.password, admin.password);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  await prisma.admin.update({
    where: { id: admin.id },
    data: { last_login: new Date() },
  });

  const tokens = await generateAdminTokens({
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
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    include: { avatar: { select: { id: true, key: true, mime_type: true } } },
  });
  if (!admin) throw new Error("NOT_FOUND");

  if (input.email && input.email !== admin.email) {
    const taken = await prisma.admin.findUnique({
      where: { email: input.email },
    });
    if (taken) throw new Error("EMAIL_TAKEN");
  }

  if (avatarFile) {
    await uploadAvatar(adminId, avatarFile, admin.avatar ?? undefined);
  }

  return prisma.admin
    .findUnique({
      where: { id: adminId },
      select: safeAdminSelect,
    })
    .then(async (updated) => {
      // apply scalar field updates first, then re-fetch with avatar
      await prisma.admin.update({
        where: { id: adminId },
        data: input,
      });
      return prisma.admin.findUnique({
        where: { id: adminId },
        select: safeAdminSelect,
      });
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
  requestorId: string,
  input: RegisterAdminInput,
  avatarFile?: UploadInput,
) {
  const existing = await prisma.admin.findUnique({
    where: { email: input.email },
  });
  if (existing) throw new Error("EMAIL_TAKEN");

  const hashed = await bcrypt.hash(input.password, 12);

  // create admin first — we need the id for media.owner_id
  const admin = await prisma.admin.create({
    data: {
      full_name: input.full_name,
      email: input.email,
      password: hashed,
      role: input.role,
    },
  });

  if (avatarFile) {
    await uploadAvatar(admin.id, avatarFile, null);
  }

  // AUDIT LOG
  createAuditLog(
    requestorId,
    AUDIT_ACTION_OBJECT.ADMIN_CREATED,
    "admin",
    admin.id,
    { email: admin.email, role: admin.role }
  ).catch(console.error);

  return prisma.admin.findUnique({
    where: { id: admin.id },
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
  const target = await prisma.admin.findUnique({
    where: { id: targetId },
    include: { avatar: { select: { id: true, key: true, mime_type: true } } },
  });
  if (!target) throw new Error("NOT_FOUND");

  if (targetId === requestorId) throw new Error("USE_PROFILE_ENDPOINT");

  if (input.role && requestorRole !== "SUPER_ADMIN") {
    throw new Error("CANNOT_CHANGE_ROLE");
  }

  if (requestorRole === "ADMIN" && target.role === "SUPER_ADMIN") {
    throw new Error("FORBIDDEN");
  }

  if (avatarFile) {
    await uploadAvatar(targetId, avatarFile, target.avatar ?? undefined);
  }

  await prisma.admin.update({
    where: { id: targetId },
    data: input,
  });

  // AUDIT LOG
  if (input.role || input.status) {
    createAuditLog(
      requestorId,
      input.role ? AUDIT_ACTION_OBJECT.ADMIN_ROLE_CHANGED : AUDIT_ACTION_OBJECT.USER_SUSPENDED, // SUSPENDED used for status: INACTIVE
      "admin",
      targetId,
      { changes: input }
    ).catch(console.error);
  }

  return prisma.admin.findUnique({
    where: { id: targetId },
    select: safeAdminSelect,
  });
}

export async function deleteAdminById(targetId: string, requestorId: string) {
  const target = await prisma.admin.findUnique({
    where: { id: targetId },
    include: { avatar: { select: { id: true, key: true, mime_type: true } } },
  });
  if (!target) throw new Error("NOT_FOUND");

  if (targetId === requestorId) throw new Error("CANNOT_DELETE_SELF");

  // delete avatar from Cloudinary first
  if (target.avatar) {
    await deleteFromCloudinary(
      target.avatar.key,
      target.avatar.mime_type,
    ).catch(() => {});
    await prisma.media.delete({ where: { id: target.avatar.id } });
  }

  await prisma.admin.delete({ where: { id: targetId } });

  // AUDIT LOG
  createAuditLog(
    requestorId,
    AUDIT_ACTION_OBJECT.USER_BANNED, // BANNED used for deletion in audit context
    "admin",
    targetId,
    { email: target.email }
  ).catch(console.error);
}
