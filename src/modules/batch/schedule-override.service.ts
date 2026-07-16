import { prisma } from "../../config/prisma.js";
import { createNotification } from "../notification/notification.service.js";

export type CreateOverrideInput = {
  override_date: string;
  type: string;
  reason?: string;
  new_start?: string;
  new_end?: string;
};

export type UpdateOverrideInput = {
  type?: string;
  reason?: string;
  new_start?: string;
  new_end?: string;
};

async function verifyBatchOwnership(batchId: string, teacherId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { service: { select: { teacher_id: true } } },
  });
  if (!batch) throw new Error("BATCH_NOT_FOUND");
  if (batch.service.teacher_id !== teacherId) throw new Error("FORBIDDEN");
}

export async function createScheduleOverride(teacherId: string, batchId: string, input: CreateOverrideInput) {
  await verifyBatchOwnership(batchId, teacherId);

  const existing = await prisma.scheduleOverride.findFirst({
    where: { batch_id: batchId, override_date: new Date(input.override_date) },
  });
  if (existing) throw new Error("OVERRIDE_ALREADY_EXISTS");

  const override = await prisma.scheduleOverride.create({
    data: {
      batch_id: batchId,
      override_date: new Date(input.override_date),
      type: input.type as any,
      reason: input.reason,
      new_start: input.new_start,
      new_end: input.new_end,
    },
  });

  // Notify enrolled students if class is cancelled
  if (input.type === "CANCELLED" || input.type === "RESCHEDULED") {
    const enrollments = await prisma.enrollment.findMany({
      where: { batch_id: batchId, status: "APPROVED" },
      select: { student_profile_id: true },
    });

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { name: true },
    });

    for (const enrollment of enrollments) {
      const student = await prisma.studentProfile.findUnique({
        where: { id: enrollment.student_profile_id },
        select: { user_id: true },
      });
      if (student) {
        createNotification({
          user_id: student.user_id,
          type: input.type === "CANCELLED" ? "CLASS_CANCELLED" : "CLASS_RESCHEDULED",
          title: input.type === "CANCELLED" ? "Class Cancelled" : "Class Rescheduled",
          body: `${batch?.name} on ${input.override_date} has been ${input.type.toLowerCase()}${input.reason ? `: ${input.reason}` : ""}`,
          reference_type: "schedule_override",
          reference_id: override.id,
        }).catch(console.error);
      }
    }
  }

  return override;
}

export async function getScheduleOverrides(batchId: string) {
  return prisma.scheduleOverride.findMany({
    where: { batch_id: batchId },
    orderBy: { override_date: "desc" },
  });
}

export async function updateScheduleOverride(teacherId: string, overrideId: string, input: UpdateOverrideInput) {
  const override = await prisma.scheduleOverride.findUnique({
    where: { id: overrideId },
    include: { batch: { include: { service: true } } },
  });
  if (!override) throw new Error("NOT_FOUND");
  if (override.batch.service.teacher_id !== teacherId) throw new Error("FORBIDDEN");

  return prisma.scheduleOverride.update({
    where: { id: overrideId },
    data: {
      ...(input.type !== undefined && { type: input.type as any }),
      ...(input.reason !== undefined && { reason: input.reason }),
      ...(input.new_start !== undefined && { new_start: input.new_start }),
      ...(input.new_end !== undefined && { new_end: input.new_end }),
    },
  });
}

export async function deleteScheduleOverride(teacherId: string, overrideId: string) {
  const override = await prisma.scheduleOverride.findUnique({
    where: { id: overrideId },
    include: { batch: { include: { service: true } } },
  });
  if (!override) throw new Error("NOT_FOUND");
  if (override.batch.service.teacher_id !== teacherId) throw new Error("FORBIDDEN");

  await prisma.scheduleOverride.delete({ where: { id: overrideId } });
}
