import { prisma } from "../../config/prisma.js";
import { UpdateStudentProfileInput } from "./student.schema.js";

/**
 * Update role-specific Student profile
 */
export async function updateStudentProfile(
  userId: string,
  input: UpdateStudentProfileInput,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
    select: { role: true },
  });

  if (!user) throw new Error("NOT_FOUND");
  if (user.role !== "STUDENT") throw new Error("INVALID_ROLE");

  return prisma.studentProfile.update({
    where: { user_id: userId },
    data: input,
  });
}

/**
 * Get student details (for internal/admin use or student's own view)
 */
export async function getStudentDetails(userId: string) {
  const student = await prisma.user.findFirst({
    where: { 
      id: userId, 
      role: "STUDENT", 
      deleted_at: null 
    },
    select: {
      id: true,
      full_name: true,
      avatar: { select: { url: true } },
      student_profile: {
        include: {
          education_level: true
        }
      },
    }
  });

  if (!student) throw new Error("NOT_FOUND");
  return student;
}
