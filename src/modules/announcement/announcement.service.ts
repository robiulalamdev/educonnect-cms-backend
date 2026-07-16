import { prisma } from "../../config/prisma.js";
import { CreateAnnouncementInput, UpdateAnnouncementInput, AnnouncementQueryInput } from "./announcement.schema.js";
import { createNotification } from "../notification/notification.service.js";
import { uploadToCloudinary, deleteFromCloudinary, type UploadInput } from "../../utils/cloudinary-upload.js";

const safeAnnouncementSelect = {
  id: true,
  batch_id: true,
  title: true,
  body: true,
  created_by_id: true,
  created_at: true,
  updated_at: true,
  batch: {
    select: { id: true, name: true, service: { select: { id: true, title: true, teacher_id: true } } },
  },
} as const;

async function verifyBatchOwnership(batchId: string, teacherId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { service: { select: { teacher_id: true } } },
  });
  if (!batch) throw new Error("BATCH_NOT_FOUND");
  if (batch.service.teacher_id !== teacherId) throw new Error("FORBIDDEN");
}

export async function createAnnouncement(teacherId: string, batchId: string, input: CreateAnnouncementInput, mediaUploads?: UploadInput[]) {
  await verifyBatchOwnership(batchId, teacherId);

  const announcement = await prisma.announcement.create({
    data: {
      batch_id: batchId,
      title: input.title,
      body: input.body,
      created_by_id: teacherId,
    },
    select: safeAnnouncementSelect,
  });

  // Notify enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where: { batch_id: batchId, status: "APPROVED" },
    select: { student_profile_id: true },
  });

  for (const enrollment of enrollments) {
    const student = await prisma.studentProfile.findUnique({
      where: { id: enrollment.student_profile_id },
      select: { user_id: true },
    });
    if (student) {
      createNotification({
        user_id: student.user_id,
        type: "NEW_ANNOUNCEMENT",
        title: "New Announcement",
        body: `${input.title}`,
        reference_type: "announcement",
        reference_id: announcement.id,
        category: "announcement",
      }).catch(console.error);
    }
  }

  return announcement;
}

export async function getAnnouncementById(id: string) {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    select: safeAnnouncementSelect,
  });
  if (!announcement) throw new Error("NOT_FOUND");
  return announcement;
}

export async function getAnnouncementList(query: AnnouncementQueryInput) {
  const { page, limit, batch_id, search } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    ...(batch_id && { batch_id }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: safeAnnouncementSelect,
    }),
    prisma.announcement.count({ where }),
  ]);

  return {
    data: announcements,
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}

export async function updateAnnouncement(teacherId: string, id: string, input: UpdateAnnouncementInput, mediaUploads?: UploadInput[]) {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    select: { batch: { select: { service: { select: { teacher_id: true } } } } },
  });
  if (!announcement) throw new Error("NOT_FOUND");
  if (announcement.batch.service.teacher_id !== teacherId) throw new Error("FORBIDDEN");

  return prisma.announcement.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.body !== undefined && { body: input.body }),
    },
    select: safeAnnouncementSelect,
  });
}

export async function deleteAnnouncement(teacherId: string, id: string) {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    select: { batch: { select: { service: { select: { teacher_id: true } } } } },
  });
  if (!announcement) throw new Error("NOT_FOUND");
  if (announcement.batch.service.teacher_id !== teacherId) throw new Error("FORBIDDEN");

  await prisma.announcement.delete({ where: { id } });
}
