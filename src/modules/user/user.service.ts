import { prisma } from "../../config/prisma.js";
import {
  UserListQueryInput,
} from "./user.schema.js";

// -- Select Helpers --

const safeUserSelect = {
  id: true,
  role: true,
  full_name: true,
  email: true,
  phone: true,
  gender: true,
  date_of_birth: true,
  bio: true,
  country: true,
  city: true,
  area: true,
  address_line: true,
  latitude: true,
  longitude: true,
  is_email_verified: true,
  status: true,
  is_approved: true,
  created_at: true,
  updated_at: true,
  avatar: {
    select: {
      id: true,
      url: true,
      key: true,
      mime_type: true,
      size: true,
      filename: true,
    },
  },
  teacher_profile: {
    select: {
      id: true,
      tagline: true,
      experience_years: true,
      qualifications: true,
      achievements: true,
      average_rating: true,
      total_reviews: true,
    },
  },
  student_profile: {
    select: {
      id: true,
      institution_name: true,
      roll_number: true,
      education_level: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  guardian_profile: {
    select: {
      id: true,
      occupation: true,
    },
  },
} as const;

// -- Service Functions --

/**
 * Get paginated list of users (teachers/students/guardians)
 */
export async function getUsers(query: UserListQueryInput) {
  const { page, limit, search, role, status, city, area } = query;
  const skip = (page - 1) * limit;

  const where = {
    deleted_at: null,
    ...(role && { role }),
    ...(status && { status }),
    ...(city && { city: { contains: city, mode: "insensitive" as const } }),
    ...(area && { area: { contains: area, mode: "insensitive" as const } }),
    ...(search && {
      OR: [
        { full_name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

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
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      has_next: page * limit < total,
    },
  };
}

/**
 * Get a single user by ID with full profile
 */
export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id, deleted_at: null },
    select: safeUserSelect,
  });

  if (!user) throw new Error("NOT_FOUND");
  return user;
}
