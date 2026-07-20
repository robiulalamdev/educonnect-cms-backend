import { prisma } from "../../config/prisma.js";
import { createAuditLog } from "./audit.service.js";
import { createNotification } from "../notification/notification.service.js";

const safeUserSelect = {
  id: true,
  role: true,
  full_name: true,
  email: true,
  phone: true,
  status: true,
  is_approved: true,
  is_email_verified: true,
  created_at: true,
  avatar: { select: { key: true } },
  teacher_profile: { select: { id: true, average_rating: true, total_reviews: true } },
  student_profile: { select: { id: true, education_level: { select: { id: true, name: true } } } },
  guardian_profile: { select: { id: true, occupation: true } },
} as const;

export async function getUserList(query: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  is_approved?: string;
  date_from?: string;
  date_to?: string;
}) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const { search, role, status, is_approved, date_from, date_to } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    deleted_at: null,
    ...(search && {
      OR: [
        { full_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(role && { role }),
    ...(status && { status }),
    ...(is_approved !== undefined && { is_approved: is_approved === "true" }),
    ...(date_from && { created_at: { gte: new Date(date_from) } }),
    ...(date_to && { created_at: { ...(date_from ? {} : {}), lte: new Date(date_to + "T23:59:59.999Z") } }),
  };

  // Merge date range into a single created_at filter
  if (date_from || date_to) {
    where.created_at = {
      ...(date_from && { gte: new Date(date_from) }),
      ...(date_to && { lte: new Date(date_to + "T23:59:59.999Z") }),
    };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: safeUserSelect,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}

export async function createUserByAdmin(adminId: string, input: {
  full_name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("EMAIL_TAKEN");

  const bcrypt = await import("bcryptjs");
  const hashed = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      full_name: input.full_name,
      email: input.email,
      password: hashed,
      role: input.role as any,
      phone: input.phone ?? null,
      status: "ACTIVE",
      is_email_verified: true,
      is_approved: input.role === "TEACHER" ? false : true,
    },
    select: safeUserSelect,
  });

  // Create role profile
  if (input.role === "TEACHER") {
    await prisma.teacherProfile.create({ data: { user_id: user.id } });
  } else if (input.role === "STUDENT") {
    await prisma.studentProfile.create({ data: { user_id: user.id } });
  } else if (input.role === "GUARDIAN") {
    await prisma.guardianProfile.create({ data: { user_id: user.id } });
  }

  createAuditLog(adminId, "USER_APPROVED", "user", user.id, { full_name: user.full_name, action: "created_by_admin" });
  return user;
}

export async function updateUserByAdmin(userId: string, input: {
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: userId, deleted_at: null } });
  if (!user) throw new Error("NOT_FOUND");

  // Check email uniqueness if changing
  if (input.email && input.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new Error("EMAIL_TAKEN");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.full_name && { full_name: input.full_name }),
      ...(input.email && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone || null }),
      ...(input.role && { role: input.role as any }),
      ...(input.status && { status: input.status as any }),
    },
    select: safeUserSelect,
  });

  return updated;
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id, deleted_at: null },
    select: safeUserSelect,
  });
  if (!user) throw new Error("NOT_FOUND");
  return user;
}

export async function approveTeacher(adminId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
    select: { id: true, role: true, full_name: true, email: true, is_approved: true },
  });
  if (!user) throw new Error("NOT_FOUND");
  if (user.role !== "TEACHER") throw new Error("MUST_BE_TEACHER");
  if (user.is_approved) throw new Error("ALREADY_APPROVED");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { is_approved: true },
    select: safeUserSelect,
  });

  createAuditLog(adminId, "USER_APPROVED", "user", userId, { full_name: user.full_name });

  createNotification({
    user_id: userId,
    type: "ACCOUNT_APPROVED",
    title: "Teacher Approved",
    body: "Your teacher account has been approved. You can now create services.",
    reference_type: "user",
    reference_id: userId,
    category: "social",
  }).catch(console.error);

  return updated;
}

export async function suspendUser(adminId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
    select: { id: true, role: true, full_name: true, status: true },
  });
  if (!user) throw new Error("NOT_FOUND");
  if (user.status === "SUSPENDED") throw new Error("ALREADY_SUSPENDED");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: "SUSPENDED" },
    select: safeUserSelect,
  });

  createAuditLog(adminId, "USER_SUSPENDED", "user", userId, { full_name: user.full_name });

  createNotification({
    user_id: userId,
    type: "ACCOUNT_SUSPENDED",
    title: "Account Suspended",
    body: "Your account has been suspended. Please contact support.",
    reference_type: "user",
    reference_id: userId,
    category: "social",
  }).catch(console.error);

  return updated;
}

export async function banUser(adminId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
    select: { id: true, role: true, full_name: true, status: true },
  });
  if (!user) throw new Error("NOT_FOUND");
  if (user.status === "BANNED") throw new Error("ALREADY_BANNED");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: "BANNED" },
    select: safeUserSelect,
  });

  createAuditLog(adminId, "USER_BANNED", "user", userId, { full_name: user.full_name });

  createNotification({
    user_id: userId,
    type: "ACCOUNT_SUSPENDED",
    title: "Account Banned",
    body: "Your account has been permanently banned.",
    reference_type: "user",
    reference_id: userId,
    category: "social",
  }).catch(console.error);

  return updated;
}

export async function reactivateUser(adminId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
    select: { id: true, role: true, full_name: true, status: true },
  });
  if (!user) throw new Error("NOT_FOUND");
  if (user.status === "ACTIVE") throw new Error("ALREADY_ACTIVE");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
    select: safeUserSelect,
  });

  createAuditLog(adminId, "USER_APPROVED", "user", userId, { full_name: user.full_name, action: "reactivated" });

  return updated;
}

export async function deleteUser(adminId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
    select: { id: true, full_name: true },
  });
  if (!user) throw new Error("NOT_FOUND");

  await prisma.user.update({
    where: { id: userId },
    data: { deleted_at: new Date(), status: "BANNED" },
  });

  createAuditLog(adminId, "USER_BANNED", "user", userId, { full_name: user.full_name, action: "soft_deleted" });
}
