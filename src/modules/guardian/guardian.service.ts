import { prisma } from "../../config/prisma.js";
import { LinkStudentInput, RespondToLinkInput } from "./guardian.schema.js";
import { GUARDIAN_TYPES } from "./guardian.types.js";

/**
 * Guardian requests to link with a student
 */
export async function requestStudentLink(guardianUserId: string, input: LinkStudentInput) {
  // 1. Find the guardian's profile
  const guardianProfile = await prisma.guardianProfile.findUnique({
    where: { user_id: guardianUserId },
    select: { id: true },
  });
  if (!guardianProfile) throw new Error("GUARDIAN_PROFILE_NOT_FOUND");

  // 2. Find student by email or phone
  const studentUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: input.student_identifier },
        { phone: input.student_identifier },
      ],
      role: "STUDENT",
      deleted_at: null,
    },
    include: {
      student_profile: { select: { id: true } },
    },
  });

  if (!studentUser || !studentUser.student_profile) throw new Error("STUDENT_NOT_FOUND");
  if (studentUser.id === guardianUserId) throw new Error("CANNOT_LINK_SELF");

  // 3. Check for existing link
  const existing = await prisma.guardianStudent.findFirst({
    where: {
      guardian_profile_id: guardianProfile.id,
      student_profile_id: studentUser.student_profile.id,
      status: { in: [GUARDIAN_TYPES.STATUS_OBJECT.PENDING, GUARDIAN_TYPES.STATUS_OBJECT.ACTIVE] as any },
    },
  });

  if (existing) {
    throw new Error(existing.status === GUARDIAN_TYPES.STATUS_OBJECT.ACTIVE ? "ALREADY_LINKED" : "LINK_PENDING");
  }

  // 4. Create the link request
  return prisma.guardianStudent.create({
    data: {
      guardian_profile_id: guardianProfile.id,
      student_profile_id: studentUser.student_profile.id,
      status: GUARDIAN_TYPES.STATUS_OBJECT.PENDING as any,
      initiated_by: "GUARDIAN",
    },
  });
}

/**
 * Get all link requests or active links for a guardian
 */
export async function getLinksForGuardian(guardianUserId: string) {
  const profile = await prisma.guardianProfile.findUnique({
    where: { user_id: guardianUserId },
    select: { id: true },
  });
  if (!profile) return [];

  return prisma.guardianStudent.findMany({
    where: { guardian_profile_id: profile.id },
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar: { select: { url: true } },
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
}

/**
 * Get all link requests for a student
 */
export async function getLinksForStudent(studentUserId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { user_id: studentUserId },
    select: { id: true },
  });
  if (!profile) return [];

  return prisma.guardianStudent.findMany({
    where: { student_profile_id: profile.id },
    include: {
      guardian: {
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar: { select: { url: true } },
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
}

/**
 * Student handles the incoming link request
 */
export async function respondToLinkRequest(studentUserId: string, input: RespondToLinkInput) {
  const profile = await prisma.studentProfile.findUnique({
    where: { user_id: studentUserId },
    select: { id: true },
  });
  if (!profile) throw new Error("STUDENT_PROFILE_NOT_FOUND");

  const link = await prisma.guardianStudent.findUnique({
    where: { id: input.link_id },
  });

  if (!link) throw new Error("LINK_NOT_FOUND");
  if (link.student_profile_id !== profile.id) throw new Error("UNAUTHORIZED");
  if (link.status !== GUARDIAN_TYPES.STATUS_OBJECT.PENDING) throw new Error("LINK_ALREADY_PROCESSED");

  return prisma.guardianStudent.update({
    where: { id: input.link_id },
    data: {
      status: input.action === GUARDIAN_TYPES.STATUS_OBJECT.ACTIVE ? GUARDIAN_TYPES.STATUS_OBJECT.ACTIVE : GUARDIAN_TYPES.STATUS_OBJECT.REMOVED as any,
      responded_at: new Date(),
    },
  });
}
