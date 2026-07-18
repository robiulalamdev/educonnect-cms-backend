import { prisma } from "../../config/prisma.js";
import { UpdateStudentProfileInput } from "./student.schema.js";

export async function updateStudentProfile(userId: string, input: UpdateStudentProfileInput) {
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

export async function getStudentDetails(userId: string) {
  const student = await prisma.user.findFirst({
    where: { id: userId, role: "STUDENT", deleted_at: null },
    select: {
      id: true,
      full_name: true,
      avatar: { select: { key: true } },
      country: true,
      state: true,
      city: true,
      area: true,
      student_profile: {
        include: { education_level: true },
      },
    },
  });

  if (!student) throw new Error("NOT_FOUND");
  return student;
}

export async function getMyStudentProfile(userId: string) {
  const student = await prisma.user.findFirst({
    where: { id: userId, role: "STUDENT", deleted_at: null },
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      gender: true,
      date_of_birth: true,
      avatar: { select: { key: true } },
      country: true,
      state: true,
      city: true,
      area: true,
      address_line: true,
      status: true,
      is_email_verified: true,
      student_profile: {
        include: { education_level: true },
      },
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!student) throw new Error("NOT_FOUND");
  return student;
}
