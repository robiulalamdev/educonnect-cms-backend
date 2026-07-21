import bcrypt from "bcryptjs";
import { EncryptJWT, jwtDecrypt } from "jose";
import crypto from "crypto";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { USER_TYPES, type IUserRole } from "./auth.types.js";
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from "./auth.schema.js";
import {
  uploadToCloudinary,
  replaceInCloudinary,
} from "../../utils/cloudinary-upload.js";
import type { UploadInput } from "../../utils/cloudinary-upload.js";
import { CLD_FOLDERS } from "../../config/cloudinary.js";
import { emailService } from "../shared/email.service.js";
import { socketManager } from "../../config/socket.js";
import { getAdminStats } from "../statistics/statistics.service.js";
import { jwtConfig } from "../../config/jwt.js";

// ── JWT Secrets ────────────────────────────────────────────

const accessSecret = jwtConfig.user.accessSecret;
const refreshSecret = jwtConfig.user.refreshSecret;

// ── JWT Payload ────────────────────────────────────────────

export type UserJwtPayload = {
  userId: string;
  email: string;
  role: IUserRole;
};

// ── Token Generators ───────────────────────────────────────

export async function generateUserAccessToken(
  payload: UserJwtPayload,
): Promise<string> {
  return new EncryptJWT({ ...payload })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRES)
    .encrypt(accessSecret);
}

export async function generateUserTokens(
  payload: UserJwtPayload,
): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    new EncryptJWT({ ...payload })
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .setIssuedAt()
      .setExpirationTime(env.JWT_ACCESS_EXPIRES)
      .encrypt(accessSecret),

    new EncryptJWT({ ...payload })
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .setIssuedAt()
      .setExpirationTime(env.JWT_REFRESH_EXPIRES)
      .encrypt(refreshSecret),
  ]);

  return { accessToken, refreshToken };
}

export async function refreshUserToken(refreshToken: string) {
  let payload: UserJwtPayload;

  try {
    const { payload: decrypted } = await jwtDecrypt(
      refreshToken,
      refreshSecret,
    );
    payload = decrypted as unknown as UserJwtPayload;
  } catch {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId, deleted_at: null },
  });

  if (!user) throw new Error("INVALID_REFRESH_TOKEN");
  if (user.status === "SUSPENDED") throw new Error("ACCOUNT_SUSPENDED");
  if (user.status === "BANNED") throw new Error("ACCOUNT_BANNED");

  return generateUserTokens({
    userId: user.id,
    email: user.email,
    role: user.role as IUserRole,
  });
}

// ── Safe select — NEVER expose password ───────────────────

const safeUserSelect = {
  id: true,
  role: true,
  username: true,
  full_name: true,
  email: true,
  phone: true,
  gender: true,
  date_of_birth: true,
  bio: true,
  country: true,
  state: true,
  city: true,
  area: true,
  address_line: true,
  latitude: true,
  longitude: true,
  is_email_verified: true,
  email_verified_at: true,
  status: true,
  is_approved: true,
  created_at: true,
  updated_at: true,
  avatar: {
    select: {
      id: true,
      key: true,
      mime_type: true,
      size: true,
      filename: true,
    },
  },
} as const;

// ── Avatar helper — matches admin.service.ts exactly ──────
//
// Pattern:
//   • existing avatar  → replaceInCloudinary (upload new → delete old) → update Media row in-place
//   • no existing      → uploadToCloudinary → create Media row → link via avatar_id
//
// The avatar_id FK on User stays the same when replacing — the Media row is updated in-place.

async function uploadUserAvatar(
  userId: string,
  avatarFile: UploadInput,
  existingAvatar?: { id: string; key: string; mime_type: string } | null,
) {
  if (existingAvatar) {
    // Upload new → delete old from Cloudinary atomically
    const result = await replaceInCloudinary(
      existingAvatar.key,
      existingAvatar.mime_type,
      avatarFile,
    );

    // Update existing Media record in-place — avatar_id on User stays the same
    await prisma.media.update({
      where: { id: existingAvatar.id },
      data: {
        // url: result.url,
        key: result.public_id,
        filename: result.filename,
        mime_type: result.mimetype,
        size: result.size,
      },
    });

    return;
  }

  // No existing avatar — upload fresh and create a new Media record
  const result = await uploadToCloudinary(avatarFile);

  const media = await prisma.media.create({
    data: {
      // url: result.url,
      key: result.public_id,
      filename: result.filename,
      mime_type: result.mimetype,
      size: result.size,
      type: "IMAGE",
      owner_type: "TEACHER", // dynamically overridden by caller where needed
      owner_id: userId,
    },
  });

  // Link new Media record to the User row
  await prisma.user.update({
    where: { id: userId },
    data: { avatar_id: media.id },
  });
}

// ── Register ───────────────────────────────────────────────

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) throw new Error("EMAIL_TAKEN");

  const hashed = await bcrypt.hash(input.password, 12);

  // Generate a secure random 6-digit email verification token
  const verificationToken = crypto.randomInt(100000, 999999).toString();
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const user = await prisma.user.create({
    data: {
      full_name: input.full_name,
      email: input.email,
      password: hashed,
      role: input.role,
      phone: input.phone ?? null,
      gender: input.gender ?? null,
      status: "PENDING_VERIFICATION",
      is_email_verified: false,
      is_approved: false,
    },
  });

  // Create role-specific profile immediately after user creation
  if (input.role === "TEACHER") {
    await prisma.teacherProfile.create({ data: { user_id: user.id } });
  } else if (input.role === "STUDENT") {
    await prisma.studentProfile.create({ data: { user_id: user.id } });
  } else if (input.role === "GUARDIAN") {
    await prisma.guardianProfile.create({ data: { user_id: user.id } });
  } else if (input.role === "COACHING_CENTER") {
    await prisma.coachingCenterProfile.create({ data: { user_id: user.id } });
  }

  // Send Verification Email immediately
  emailService
    .sendVerificationEmail(user.email, verificationToken)
    .catch(console.error);

  // Still record in Queue for audit/retry purposes
  await prisma.emailQueue.create({
    data: {
      to_email: user.email,
      to_name: user.full_name,
      subject: "Verify your email — Coaching Management System",
      template: "email_verification",
      payload: {
        token: verificationToken,
        expires_at: verificationExpiry.toISOString(),
        user_id: user.id,
      },
      sent: false, // Must be false so verifyEmail can find it
      max_attempts: 3,
    },
  });

  // Trigger real-time statistics update for admins
  getAdminStats()
    .then((stats) => {
      socketManager.emitStatsUpdate(stats);
    })
    .catch(console.error);

  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

// ── Login ──────────────────────────────────────────────────

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email, deleted_at: null },
  });

  if (!user) throw new Error("INVALID_CREDENTIALS");
  if (user.status === "BANNED") throw new Error("ACCOUNT_BANNED");
  if (user.status === "SUSPENDED") throw new Error("ACCOUNT_SUSPENDED");

  if (user.role === "COACHING_CENTER" && !user.is_approved) {
    throw new Error("ACCOUNT_PENDING_APPROVAL");
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  if (!user.is_email_verified) throw new Error("EMAIL_NOT_VERIFIED");

  const tokens = await generateUserTokens({
    userId: user.id,
    email: user.email,
    role: user.role as IUserRole,
  });

  return {
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      is_approved: user.is_approved,
      is_email_verified: user.is_email_verified,
    },
    tokens,
  };
}

// ── Verify Email ───────────────────────────────────────────

export async function verifyEmail(email: string, token: string) {
  // Find the most recent unused verification email for this token
  const entry = await prisma.emailQueue.findFirst({
    where: {
      to_email: email,
      template: "email_verification",
      sent: false,
    },
    orderBy: { created_at: "desc" },
  });

  if (!entry) throw new Error("INVALID_TOKEN");

  const payload = entry.payload as Record<string, any>;
  if (payload?.token !== token) {
    const nextAttempts = entry.attempts + 1;
    if (nextAttempts >= entry.max_attempts) {
      await prisma.emailQueue.update({
        where: { id: entry.id },
        data: { attempts: nextAttempts, sent: true, error: "MAX_ATTEMPTS_REACHED" },
      });
      throw new Error("MAX_ATTEMPTS_REACHED");
    } else {
      await prisma.emailQueue.update({
        where: { id: entry.id },
        data: { attempts: nextAttempts },
      });
      throw new Error("INVALID_TOKEN");
    }
  }

  const expires = new Date(payload.expires_at as string);
  if (expires < new Date()) throw new Error("TOKEN_EXPIRED");

  const userId = payload.user_id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
  });

  if (!user) throw new Error("NOT_FOUND");
  if (user.is_email_verified) throw new Error("ALREADY_VERIFIED");

  // Mark user as verified and activate account
  await prisma.user.update({
    where: { id: userId },
    data: {
      is_email_verified: true,
      email_verified_at: new Date(),
      status: "ACTIVE",
    },
  });

  // Consume the token so it can't be re-used
  await prisma.emailQueue.update({
    where: { id: entry.id },
    data: { sent: true },
  });
}

// ── Resend Verification Email ──────────────────────────────

export async function resendVerificationEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email, deleted_at: null },
  });

  if (!user) throw new Error("NOT_FOUND");
  if (user.is_email_verified) throw new Error("ALREADY_VERIFIED");
  if (user.status === "BANNED") throw new Error("ACCOUNT_BANNED");

  const verificationToken = crypto.randomInt(100000, 999999).toString();
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await prisma.emailQueue.create({
    data: {
      to_email: user.email,
      to_name: user.full_name,
      subject: "Verify your email — Coaching Management System",
      template: "email_verification",
      payload: {
        token: verificationToken,
        expires_at: verificationExpiry.toISOString(),
        user_id: user.id,
      },
      max_attempts: 3,
    },
  });
}

// ── Forgot Password ────────────────────────────────────────

export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email, deleted_at: null },
  });

  // Silently return — NEVER reveal whether this email is registered
  if (!user || user.status === "BANNED") return;

  const resetToken = crypto.randomInt(100000, 999999).toString();
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.emailQueue.create({
    data: {
      to_email: user.email,
      to_name: user.full_name,
      subject: "Reset your password — Coaching Management System",
      template: "password_reset",
      payload: {
        token: resetToken,
        expires_at: resetExpiry.toISOString(),
        user_id: user.id,
      },
      max_attempts: 3,
    },
  });
}

// ── Reset Password ─────────────────────────────────────────

export async function resetPassword(input: ResetPasswordInput) {
  const entry = await prisma.emailQueue.findFirst({
    where: {
      template: "password_reset",
      sent: false,
    },
    orderBy: { created_at: "desc" },
  });

  if (!entry) throw new Error("INVALID_TOKEN");

  const payload = entry.payload as Record<string, any>;
  if (payload?.token !== input.token) {
    const nextAttempts = entry.attempts + 1;
    if (nextAttempts >= entry.max_attempts) {
      await prisma.emailQueue.update({
        where: { id: entry.id },
        data: { attempts: nextAttempts, sent: true, error: "MAX_ATTEMPTS_REACHED" },
      });
      throw new Error("MAX_ATTEMPTS_REACHED");
    } else {
      await prisma.emailQueue.update({
        where: { id: entry.id },
        data: { attempts: nextAttempts },
      });
      throw new Error("INVALID_TOKEN");
    }
  }

  const expires = new Date(payload.expires_at as string);
  if (expires < new Date()) throw new Error("TOKEN_EXPIRED");

  const userId = payload.user_id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
  });

  if (!user) throw new Error("NOT_FOUND");
  if (user.status === "BANNED") throw new Error("ACCOUNT_BANNED");

  const hashed = await bcrypt.hash(input.new_password, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  // Consume the token so it can't be re-used
  await prisma.emailQueue.update({
    where: { id: entry.id },
    data: { sent: true },
  });
}

// ── Change Password (authenticated) ───────────────────────

export async function changeUserPassword(
  userId: string,
  input: ChangePasswordInput,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
  });
  if (!user) throw new Error("NOT_FOUND");

  const valid = await bcrypt.compare(input.current_password, user.password);
  if (!valid) throw new Error("WRONG_PASSWORD");

  const hashed = await bcrypt.hash(input.new_password, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
}

// ── Get Own Profile ────────────────────────────────────────

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
    select: safeUserSelect,
  });

  if (!user) throw new Error("NOT_FOUND");
  if (user.status === "BANNED") throw new Error("ACCOUNT_BANNED");
  if (user.status === "SUSPENDED") throw new Error("ACCOUNT_SUSPENDED");

  return user;
}

// ── Update Own Profile (with optional avatar upload) ──────
//
// Follows the exact same pattern as admin.service.ts:updateOwnProfile
//   1. Fetch user + existing avatar
//   2. If email changed → check uniqueness
//   3. If avatarFile provided → uploadUserAvatar (replace or create)
//   4. Apply scalar field updates
//   5. Re-fetch with safe select and return

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput,
  avatarFile?: UploadInput,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
    include: {
      avatar: { select: { id: true, key: true, mime_type: true } },
    },
  });
  if (!user) throw new Error("NOT_FOUND");

  // Handle avatar upload / replacement
  if (avatarFile) {
    // Override owner_type to match the user's actual role for accurate audit trail
    const ownerType =
      user.role === USER_TYPES.ROLE_OBJECT.TEACHER
        ? USER_TYPES.ROLE_OBJECT.TEACHER
        : user.role === USER_TYPES.ROLE_OBJECT.STUDENT
          ? USER_TYPES.ROLE_OBJECT.STUDENT
          : USER_TYPES.ROLE_OBJECT.GUARDIAN;

    const avatarFileWithFolder: UploadInput = {
      ...avatarFile,
      folder: CLD_FOLDERS.USER_AVATARS,
    };

    await uploadUserAvatar(userId, avatarFileWithFolder, user.avatar ?? null);

    // Patch owner_type on the media row to reflect actual role
    if (!user.avatar) {
      // Newly created media — update owner_type
      const updated = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatar_id: true },
      });
      if (updated?.avatar_id) {
        await prisma.media.update({
          where: { id: updated.avatar_id },
          data: { owner_type: ownerType },
        });
      }
    }
  }

  // Apply scalar profile field updates
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.full_name && { full_name: input.full_name }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.gender && { gender: input.gender }),
      ...(input.date_of_birth && {
        date_of_birth: new Date(input.date_of_birth),
      }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.country !== undefined && { country: input.country }),
      ...(input.state !== undefined && { state: input.state }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.area !== undefined && { area: input.area }),
      ...(input.address_line !== undefined && {
        address_line: input.address_line,
      }),
    },
  });

  // Re-fetch and return with safe select
  return prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  });
}
