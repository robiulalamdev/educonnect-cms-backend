import { prisma } from "../../config/prisma.js";
import { UpdateGuardianProfileInput, SendLinkRequestInput, RespondLinkRequestInput } from "./guardian.schema.js";
import { createNotification } from "../notification/notification.service.js";

/**
 * Update role-specific Guardian profile
 */
export async function updateGuardianProfile(userId: string, input: UpdateGuardianProfileInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
    select: { role: true },
  });

  if (!user) throw new Error("NOT_FOUND");
  if (user.role !== "GUARDIAN") throw new Error("INVALID_ROLE");

  return prisma.guardianProfile.update({
    where: { user_id: userId },
    data: input,
  });
}

/**
 * Get guardian details
 */
export async function getGuardianDetails(userId: string) {
  const guardian = await prisma.user.findFirst({
    where: { id: userId, role: "GUARDIAN", deleted_at: null },
    select: {
      id: true,
      full_name: true,
      avatar: { select: { key: true } },
      guardian_profile: true,
    },
  });

  if (!guardian) throw new Error("NOT_FOUND");
  return guardian;
}

// ── Guardian-Student Link Flow ─────────────────────────────

export async function sendLinkRequest(guardianId: string, input: SendLinkRequestInput) {
  const { target_user_id, relation_label } = input;

  // Get guardian profile
  const guardianProfile = await prisma.guardianProfile.findUnique({
    where: { user_id: guardianId },
  });
  if (!guardianProfile) throw new Error("GUARDIAN_PROFILE_NOT_FOUND");

  // Get target user and their student profile
  const targetUser = await prisma.user.findUnique({
    where: { id: target_user_id },
    select: { id: true, role: true, student_profile: true },
  });
  if (!targetUser) throw new Error("USER_NOT_FOUND");
  if (targetUser.role !== "STUDENT") throw new Error("TARGET_MUST_BE_STUDENT");
  if (!targetUser.student_profile) throw new Error("TARGET_NO_STUDENT_PROFILE");

  // Check if link already exists
  const existingLink = await prisma.guardianStudent.findUnique({
    where: {
      guardian_profile_id_student_profile_id: {
        guardian_profile_id: guardianProfile.id,
        student_profile_id: targetUser.student_profile.id,
      },
    },
  });
  if (existingLink) throw new Error("ALREADY_LINKED_OR_PENDING");

  const link = await prisma.guardianStudent.create({
    data: {
      guardian_profile_id: guardianProfile.id,
      student_profile_id: targetUser.student_profile.id,
      initiated_by: "GUARDIAN",
      relation_label,
    },
  });

  // Notify student
  createNotification({
    user_id: target_user_id,
    type: "GUARDIAN_LINK_REQUEST",
    title: "Guardian Link Request",
    body: `You have a new guardian link request`,
    reference_type: "guardian_student",
    reference_id: link.id,
    category: "social",
  }).catch(console.error);

  return link;
}

export async function respondToLinkRequest(userId: string, linkId: string, input: RespondLinkRequestInput) {
  const link = await prisma.guardianStudent.findUnique({
    where: { id: linkId },
    include: { guardian: { select: { user_id: true } }, student: { select: { user_id: true } } },
  });

  if (!link) throw new Error("NOT_FOUND");
  if (link.status !== "PENDING") throw new Error("ALREADY_RESPONDED");

  // Only the recipient can respond
  if (link.initiated_by === "GUARDIAN" && link.student.user_id !== userId) throw new Error("FORBIDDEN");
  if (link.initiated_by === "STUDENT" && link.guardian.user_id !== userId) throw new Error("FORBIDDEN");

  if (input.action === "REJECT") {
    await prisma.guardianStudent.delete({ where: { id: linkId } });
    return { action: "REJECTED" };
  }

  const updated = await prisma.guardianStudent.update({
    where: { id: linkId },
    data: { status: "ACTIVE", responded_at: new Date() },
  });

  // Notify the initiator
  const notifyUserId = link.initiated_by === "GUARDIAN" ? link.guardian.user_id : link.student.user_id;
  createNotification({
    user_id: notifyUserId,
    type: "GUARDIAN_LINK_ACCEPTED",
    title: "Guardian Link Accepted",
    body: "Your guardian link request was accepted",
    reference_type: "guardian_student",
    reference_id: linkId,
    category: "social",
  }).catch(console.error);

  return updated;
}

export async function getMyLinks(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) throw new Error("NOT_FOUND");

  if (user.role === "GUARDIAN") {
    const profile = await prisma.guardianProfile.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });
    if (!profile) throw new Error("GUARDIAN_PROFILE_NOT_FOUND");

    return prisma.guardianStudent.findMany({
      where: { guardian_profile_id: profile.id },
      include: {
        student: {
          select: {
            id: true,
            user: { select: { id: true, full_name: true, email: true, avatar: { select: { key: true } } } },
          },
        },
      },
    });
  }

  if (user.role === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });
    if (!profile) throw new Error("STUDENT_PROFILE_NOT_FOUND");

    return prisma.guardianStudent.findMany({
      where: { student_profile_id: profile.id },
      include: {
        guardian: {
          select: {
            id: true,
            user: { select: { id: true, full_name: true, email: true, avatar: { select: { key: true } } } },
          },
        },
      },
    });
  }

  throw new Error("INVALID_ROLE");
}

export async function removeLink(userId: string, linkId: string) {
  const link = await prisma.guardianStudent.findUnique({
    where: { id: linkId },
    include: { guardian: { select: { user_id: true } }, student: { select: { user_id: true } } },
  });

  if (!link) throw new Error("NOT_FOUND");
  if (link.guardian.user_id !== userId && link.student.user_id !== userId) throw new Error("FORBIDDEN");

  await prisma.guardianStudent.delete({ where: { id: linkId } });
}

// ── Admin: Direct Link Management ─────────────────────────

/**
 * Admin creates a direct guardian-student link (status: ACTIVE immediately, no request flow)
 */
export async function adminDirectLink(
  guardianUserId: string,
  studentUserId: string,
  relationLabel?: string,
) {
  // Validate guardian
  const guardianUser = await prisma.user.findUnique({
    where: { id: guardianUserId, deleted_at: null },
    select: { id: true, role: true, full_name: true },
  });
  if (!guardianUser) throw new Error("GUARDIAN_NOT_FOUND");
  if (guardianUser.role !== "GUARDIAN") throw new Error("USER_NOT_GUARDIAN");

  const guardianProfile = await prisma.guardianProfile.findUnique({
    where: { user_id: guardianUserId },
  });
  if (!guardianProfile) throw new Error("GUARDIAN_PROFILE_NOT_FOUND");

  // Validate student
  const studentUser = await prisma.user.findUnique({
    where: { id: studentUserId, deleted_at: null },
    select: { id: true, role: true, full_name: true, student_profile: true },
  });
  if (!studentUser) throw new Error("STUDENT_NOT_FOUND");
  if (studentUser.role !== "STUDENT") throw new Error("USER_NOT_STUDENT");
  if (!studentUser.student_profile) throw new Error("STUDENT_NO_PROFILE");

  // Check if link already exists
  const existing = await prisma.guardianStudent.findUnique({
    where: {
      guardian_profile_id_student_profile_id: {
        guardian_profile_id: guardianProfile.id,
        student_profile_id: studentUser.student_profile.id,
      },
    },
  });
  if (existing) throw new Error("ALREADY_LINKED");

  // Create directly as ACTIVE
  const link = await prisma.guardianStudent.create({
    data: {
      guardian_profile_id: guardianProfile.id,
      student_profile_id: studentUser.student_profile.id,
      status: "ACTIVE",
      initiated_by: "GUARDIAN",
      relation_label: relationLabel || "Guardian",
      responded_at: new Date(),
    },
    include: {
      guardian: {
        select: {
          id: true,
          user: { select: { id: true, full_name: true, email: true, avatar: { select: { key: true } } } },
        },
      },
      student: {
        select: {
          id: true,
          user: { select: { id: true, full_name: true, email: true, avatar: { select: { key: true } } } },
        },
      },
    },
  });

  return link;
}

/**
 * Admin: List all guardian-student links with pagination and search
 */
export async function adminGetAllLinks(query: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { guardian: { user: { full_name: { contains: query.search, mode: "insensitive" } } } },
      { guardian: { user: { email: { contains: query.search, mode: "insensitive" } } } },
      { student: { user: { full_name: { contains: query.search, mode: "insensitive" } } } },
      { student: { user: { email: { contains: query.search, mode: "insensitive" } } } },
    ];
  }

  const [links, total] = await Promise.all([
    prisma.guardianStudent.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: "desc" },
      include: {
        guardian: {
          select: {
            id: true,
            user: { select: { id: true, full_name: true, email: true, avatar: { select: { key: true } } } },
          },
        },
        student: {
          select: {
            id: true,
            user: { select: { id: true, full_name: true, email: true, avatar: { select: { key: true } } } },
          },
        },
      },
    }),
    prisma.guardianStudent.count({ where }),
  ]);

  return {
    data: links,
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}

/**
 * Admin: Remove a guardian-student link
 */
export async function adminRemoveLink(linkId: string) {
  const link = await prisma.guardianStudent.findUnique({ where: { id: linkId } });
  if (!link) throw new Error("NOT_FOUND");
  await prisma.guardianStudent.delete({ where: { id: linkId } });
  return { success: true };
}
