import { prisma } from "../../config/prisma.js";
import { CreateTaskInput, UpdateTaskInput, TaskQueryInput } from "./task.schema.js";
import { TASK_TYPES } from "./task.types.js";
import { createNotification } from "../notification/notification.service.js";
import { uploadToCloudinary, deleteFromCloudinary, type UploadInput } from "../../utils/cloudinary-upload.js";

const safeTaskSelect = {
  id: true,
  batch_id: true,
  title: true,
  description: true,
  due_date: true,
  class_date: true,
  status: true,
  created_by_id: true,
  created_at: true,
  updated_at: true,
  batch: {
    select: { id: true, name: true, service: { select: { id: true, title: true, teacher_id: true } } },
  },
  visibilities: {
    select: { student_profile_id: true, can_view: true },
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

export async function createTask(teacherId: string, batchId: string, input: CreateTaskInput, attachmentUploads?: UploadInput[]) {
  await verifyBatchOwnership(batchId, teacherId);

  return prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        batch_id: batchId,
        title: input.title,
        description: input.description,
        due_date: input.due_date ? new Date(input.due_date) : null,
        class_date: input.class_date ? new Date(input.class_date) : null,
        created_by_id: teacherId,
      },
      select: safeTaskSelect,
    });

    // Create visibility for all approved students in the batch
    const enrollments = await tx.enrollment.findMany({
      where: { batch_id: batchId, status: "APPROVED" },
      select: { student_profile_id: true },
    });

    if (enrollments.length > 0) {
      await tx.taskVisibility.createMany({
        data: enrollments.map((e) => ({
          task_id: task.id,
          student_profile_id: e.student_profile_id,
          can_view: true,
        })),
      });
    }

    // Notify all enrolled students
    for (const enrollment of enrollments) {
      const student = await tx.studentProfile.findUnique({
        where: { id: enrollment.student_profile_id },
        select: { user_id: true },
      });
      if (student) {
        createNotification({
          user_id: student.user_id,
          type: "NEW_TASK",
          title: "New Task Assigned",
          body: `You have a new task: ${input.title}`,
          reference_type: "task",
          reference_id: task.id,
        }).catch(console.error);
      }
    }

    return task;
  });
}

export async function getTaskById(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: safeTaskSelect,
  });
  if (!task) throw new Error("NOT_FOUND");
  return task;
}

export async function getTaskList(query: TaskQueryInput) {
  const { page, limit, batch_id, status, search } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    ...(batch_id && { batch_id }),
    ...(status && { status }),
    ...(search && {
      title: { contains: search, mode: "insensitive" },
    }),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: safeTaskSelect,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    data: tasks,
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}

export async function getStudentTasks(studentId: string, batchId?: string) {
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { user_id: studentId },
  });
  if (!studentProfile) throw new Error("STUDENT_PROFILE_NOT_FOUND");

  const where: any = {
    status: TASK_TYPES.STATUS_OBJECT.ACTIVE,
    visibilities: {
      some: {
        student_profile_id: studentProfile.id,
        can_view: true,
      },
    },
    ...(batchId && { batch_id: batchId }),
  };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      due_date: true,
      class_date: true,
      status: true,
      created_at: true,
      batch: { select: { id: true, name: true } },
    },
  });

  return tasks;
}

export async function updateTask(teacherId: string, taskId: string, input: UpdateTaskInput, attachmentUploads?: UploadInput[]) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { batch: { select: { service: { select: { teacher_id: true } } } } },
  });
  if (!task) throw new Error("NOT_FOUND");
  if (task.batch.service.teacher_id !== teacherId) throw new Error("FORBIDDEN");

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.due_date !== undefined && { due_date: input.due_date ? new Date(input.due_date) : null }),
      ...(input.class_date !== undefined && { class_date: input.class_date ? new Date(input.class_date) : null }),
      ...(input.status !== undefined && { status: input.status }),
    },
    select: safeTaskSelect,
  });
}

export async function deleteTask(teacherId: string, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { batch: { select: { service: { select: { teacher_id: true } } } } },
  });
  if (!task) throw new Error("NOT_FOUND");
  if (task.batch.service.teacher_id !== teacherId) throw new Error("FORBIDDEN");

  await prisma.task.delete({ where: { id: taskId } });
}
