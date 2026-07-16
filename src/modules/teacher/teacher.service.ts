import { prisma } from "../../config/prisma.js";
import { UpdateTeacherProfileInput } from "./teacher.schema.js";

export async function updateTeacherProfile(userId: string, input: UpdateTeacherProfileInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
    select: { role: true },
  });

  if (!user) throw new Error("NOT_FOUND");
  if (user.role !== "TEACHER") throw new Error("INVALID_ROLE");

  return prisma.teacherProfile.update({
    where: { user_id: userId },
    data: input,
  });
}

export async function getTeacherDetails(id: string) {
  const teacher = await prisma.user.findFirst({
    where: { id, role: "TEACHER", deleted_at: null, is_email_verified: true, is_approved: true },
    select: {
      id: true,
      full_name: true,
      avatar: { select: { key: true } },
      city: true,
      area: true,
      teacher_profile: true,
      services: {
        where: { status: "ACTIVE", deleted_at: null },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          format: true,
          mode: true,
          average_rating: true,
          total_reviews: true,
        },
      },
      _count: {
        select: {
          followers: true,
          services: { where: { status: "ACTIVE", deleted_at: null } },
        },
      },
    },
  });

  if (!teacher) throw new Error("NOT_FOUND");
  return teacher;
}

export async function getMyTeacherProfile(userId: string) {
  const teacher = await prisma.user.findFirst({
    where: { id: userId, role: "TEACHER", deleted_at: null },
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      avatar: { select: { key: true } },
      city: true,
      area: true,
      is_approved: true,
      is_email_verified: true,
      status: true,
      teacher_profile: true,
      _count: {
        select: {
          followers: true,
          following: true,
          services: { where: { deleted_at: null } },
        },
      },
    },
  });

  if (!teacher) throw new Error("NOT_FOUND");
  return teacher;
}

export async function listTeachers(query: { page?: number; limit?: number; search?: string; city?: string }) {
  const { page = 1, limit = 20, search, city } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    role: "TEACHER",
    deleted_at: null,
    is_approved: true,
    is_email_verified: true,
    ...(search && { full_name: { contains: search, mode: "insensitive" } }),
    ...(city && { city: { contains: city, mode: "insensitive" } }),
  };

  const [teachers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        full_name: true,
        avatar: { select: { key: true } },
        city: true,
        area: true,
        teacher_profile: true,
        _count: {
          select: {
            followers: true,
            services: { where: { status: "ACTIVE", deleted_at: null } },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: teachers,
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}
