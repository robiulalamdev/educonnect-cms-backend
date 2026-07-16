import { prisma } from "../../config/prisma.js";
import { CreateDailyNoteInput, UpdateDailyNoteInput, DailyNoteQueryInput } from "./daily-note.schema.js";
import { createNotification } from "../notification/notification.service.js";
import { uploadToCloudinary, deleteFromCloudinary, type UploadInput } from "../../utils/cloudinary-upload.js";

const safeNoteSelect = {
  id: true,
  batch_id: true,
  note_date: true,
  title: true,
  content: true,
  next_day_plan: true,
  created_by_id: true,
  created_at: true,
  updated_at: true,
  batch: {
    select: { id: true, name: true, service: { select: { id: true, title: true, teacher_id: true } } },
  },
  visibilities: { select: { student_profile_id: true, can_view: true } },
} as const;

async function verifyBatchOwnership(batchId: string, teacherId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { service: { select: { teacher_id: true } } },
  });
  if (!batch) throw new Error("BATCH_NOT_FOUND");
  if (batch.service.teacher_id !== teacherId) throw new Error("FORBIDDEN");
}

export async function createDailyNote(teacherId: string, batchId: string, input: CreateDailyNoteInput, attachmentUploads?: UploadInput[]) {
  await verifyBatchOwnership(batchId, teacherId);

  const existing = await prisma.dailyNote.findUnique({
    where: { batch_id_note_date: { batch_id: batchId, note_date: new Date(input.note_date) } },
  });
  if (existing) throw new Error("NOTE_ALREADY_EXISTS_FOR_DATE");

  return prisma.$transaction(async (tx) => {
    const note = await tx.dailyNote.create({
      data: {
        batch_id: batchId,
        note_date: new Date(input.note_date),
        title: input.title,
        content: input.content,
        next_day_plan: input.next_day_plan,
        created_by_id: teacherId,
      },
      select: safeNoteSelect,
    });

    // Create visibility for all approved students
    const enrollments = await tx.enrollment.findMany({
      where: { batch_id: batchId, status: "APPROVED" },
      select: { student_profile_id: true },
    });

    if (enrollments.length > 0) {
      await tx.noteVisibility.createMany({
        data: enrollments.map((e) => ({
          note_id: note.id,
          student_profile_id: e.student_profile_id,
          can_view: true,
        })),
      });
    }

    // Notify enrolled students
    for (const enrollment of enrollments) {
      const student = await tx.studentProfile.findUnique({
        where: { id: enrollment.student_profile_id },
        select: { user_id: true },
      });
      if (student) {
        createNotification({
          user_id: student.user_id,
          type: "NEW_DAILY_NOTE",
          title: "New Daily Note",
          body: input.title ? `New note: ${input.title}` : "New daily note posted",
          reference_type: "daily_note",
          reference_id: note.id,
        }).catch(console.error);
      }
    }

    return note;
  });
}

export async function getDailyNoteById(noteId: string) {
  const note = await prisma.dailyNote.findUnique({
    where: { id: noteId },
    select: safeNoteSelect,
  });
  if (!note) throw new Error("NOT_FOUND");
  return note;
}

export async function getDailyNoteList(query: DailyNoteQueryInput) {
  const { page, limit, batch_id, date_from, date_to, search } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    ...(batch_id && { batch_id }),
    ...(date_from || date_to
      ? {
          note_date: {
            ...(date_from && { gte: new Date(date_from) }),
            ...(date_to && { lte: new Date(date_to) }),
          },
        }
      : {}),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [notes, total] = await Promise.all([
    prisma.dailyNote.findMany({
      where,
      skip,
      take: limit,
      orderBy: { note_date: "desc" },
      select: safeNoteSelect,
    }),
    prisma.dailyNote.count({ where }),
  ]);

  return {
    data: notes,
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}

export async function getStudentNotes(studentId: string, batchId?: string) {
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { user_id: studentId },
  });
  if (!studentProfile) throw new Error("STUDENT_PROFILE_NOT_FOUND");

  const where: any = {
    visibilities: {
      some: { student_profile_id: studentProfile.id, can_view: true },
    },
    ...(batchId && { batch_id: batchId }),
  };

  return prisma.dailyNote.findMany({
    where,
    orderBy: { note_date: "desc" },
    select: {
      id: true,
      note_date: true,
      title: true,
      content: true,
      next_day_plan: true,
      created_at: true,
      batch: { select: { id: true, name: true } },
    },
  });
}

export async function updateDailyNote(teacherId: string, noteId: string, input: UpdateDailyNoteInput, attachmentUploads?: UploadInput[]) {
  const note = await prisma.dailyNote.findUnique({
    where: { id: noteId },
    select: { batch: { select: { service: { select: { teacher_id: true } } } } },
  });
  if (!note) throw new Error("NOT_FOUND");
  if (note.batch.service.teacher_id !== teacherId) throw new Error("FORBIDDEN");

  return prisma.dailyNote.update({
    where: { id: noteId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.next_day_plan !== undefined && { next_day_plan: input.next_day_plan }),
    },
    select: safeNoteSelect,
  });
}

export async function deleteDailyNote(teacherId: string, noteId: string) {
  const note = await prisma.dailyNote.findUnique({
    where: { id: noteId },
    select: { batch: { select: { service: { select: { teacher_id: true } } } } },
  });
  if (!note) throw new Error("NOT_FOUND");
  if (note.batch.service.teacher_id !== teacherId) throw new Error("FORBIDDEN");

  await prisma.dailyNote.delete({ where: { id: noteId } });
}
