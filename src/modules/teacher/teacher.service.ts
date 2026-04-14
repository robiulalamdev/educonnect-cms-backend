import { prisma } from "../../config/prisma.js";
import { UpdateTeacherProfileInput } from "./teacher.schema.js";

/**
 * Update role-specific Teacher profile
 */
export async function updateTeacherProfile(
  userId: string,
  input: UpdateTeacherProfileInput,
) {
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

/**
 * Get public teacher details (for profile pages)
 */
export async function getTeacherDetails(id: string) {
  const teacher = await prisma.user.findFirst({
    where: { 
      id, 
      role: "TEACHER", 
      deleted_at: null 
    },
    select: {
      id: true,
      full_name: true,
      avatar: { select: { url: true } },
      teacher_profile: true,
    }
  });

  if (!teacher) throw new Error("NOT_FOUND");
  return teacher;
}
