import { prisma } from "../../config/prisma.js";
import {
  MarkAttendanceInput,
  BulkMarkAttendanceInput,
  AttendanceQueryInput,
} from "./attendance.schema.js";

const safeAttendanceSelect = {
  id: true,
  batch_id: true,
  student_profile_id: true,
  class_date: true,
  status: true,
  note: true,
  marked_by_id: true,
  marked_at: true,
  created_at: true,
  student: {
    select: {
      id: true,
      user: {
        select: { id: true, full_name: true, avatar: { select: { key: true } } },
      },
    },
  },
  marked_by: {
    select: { id: true, full_name: true },
  },
} as const;

// Verify teacher owns the batch
async function verifyBatchOwnership(batchId: string, teacherId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { service: { select: { teacher_id: true } } },
  });
  if (!batch) throw new Error("BATCH_NOT_FOUND");
  if (batch.service.teacher_id !== teacherId) throw new Error("FORBIDDEN");
  return batch;
}

export async function markAttendance(teacherId: string, batchId: string, input: MarkAttendanceInput) {
  await verifyBatchOwnership(batchId, teacherId);

  const { student_profile_id, class_date, status, note } = input;

  return prisma.attendance.upsert({
    where: {
      batch_id_student_profile_id_class_date: {
        batch_id: batchId,
        student_profile_id,
        class_date: new Date(class_date),
      },
    },
    update: { status, note, marked_by_id: teacherId, marked_at: new Date() },
    create: {
      batch_id: batchId,
      student_profile_id,
      class_date: new Date(class_date),
      status,
      note,
      marked_by_id: teacherId,
    },
    select: safeAttendanceSelect,
  });
}

export async function bulkMarkAttendance(teacherId: string, batchId: string, input: BulkMarkAttendanceInput) {
  await verifyBatchOwnership(batchId, teacherId);

  const { class_date, records } = input;

  return prisma.$transaction(async (tx) => {
    const results = [];
    for (const record of records) {
      const result = await tx.attendance.upsert({
        where: {
          batch_id_student_profile_id_class_date: {
            batch_id: batchId,
            student_profile_id: record.student_profile_id,
            class_date: new Date(class_date),
          },
        },
        update: {
          status: record.status,
          note: record.note,
          marked_by_id: teacherId,
          marked_at: new Date(),
        },
        create: {
          batch_id: batchId,
          student_profile_id: record.student_profile_id,
          class_date: new Date(class_date),
          status: record.status,
          note: record.note,
          marked_by_id: teacherId,
        },
        select: safeAttendanceSelect,
      });
      results.push(result);
    }
    return results;
  });
}

export async function getAttendanceList(query: AttendanceQueryInput) {
  const { page, limit, batch_id, student_profile_id, class_date, date_from, date_to, status } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    ...(batch_id && { batch_id }),
    ...(student_profile_id && { student_profile_id }),
    ...(class_date && { class_date: new Date(class_date) }),
    ...(date_from && { class_date: { gte: new Date(date_from) } }),
    ...(date_to && { class_date: { lte: new Date(date_to) } }),
    ...(status && { status }),
  };

  if (date_from || date_to) {
    if (class_date) {
      // class_date takes precedence — remove date range
      delete where.date_from;
      delete where.date_to;
    } else {
      where.class_date = {
        ...(date_from && { gte: new Date(date_from) }),
        ...(date_to && { lte: new Date(date_to) }),
      };
    }
  }

  const [attendances, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ class_date: "desc" }, { created_at: "desc" }],
      select: safeAttendanceSelect,
    }),
    prisma.attendance.count({ where }),
  ]);

  return {
    data: attendances,
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}

export async function getStudentAttendanceSummary(batchId: string, studentProfileId: string) {
  const [total, present, absent, late, excused] = await Promise.all([
    prisma.attendance.count({ where: { batch_id: batchId, student_profile_id: studentProfileId } }),
    prisma.attendance.count({ where: { batch_id: batchId, student_profile_id: studentProfileId, status: "PRESENT" } }),
    prisma.attendance.count({ where: { batch_id: batchId, student_profile_id: studentProfileId, status: "ABSENT" } }),
    prisma.attendance.count({ where: { batch_id: batchId, student_profile_id: studentProfileId, status: "LATE" } }),
    prisma.attendance.count({ where: { batch_id: batchId, student_profile_id: studentProfileId, status: "EXCUSED" } }),
  ]);

  return {
    total_classes: total,
    present,
    absent,
    late,
    excused,
    attendance_rate: total > 0 ? Math.round((present / total) * 100) : 0,
  };
}
