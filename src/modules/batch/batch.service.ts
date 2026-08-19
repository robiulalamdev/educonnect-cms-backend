import { prisma } from "../../config/prisma.js";
import { CreateBatchInput, UpdateBatchInput, BatchQueryInput, DropdownQueryInput } from "./batch.schema.js";
import { BATCH_TYPES } from "./batch.types.js";
import { CHAT_TYPES } from "../chat/chat.types.js";

const safeBatchSelect = {
  id: true,
  name: true,
  description: true,
  max_students: true,
  enrolled_count: true,
  waitlist_enabled: true,
  waitlist_count: true,
  status: true,
  start_date: true,
  end_date: true,
  service_id: true,
  service: {
    select: {
      title: true,
      teacher_id: true,
    }
  },
  schedule: {
    select: {
      day: true,
      start_time: true,
      end_time: true
    }
  },
  group_chat: {
    select: {
      id: true
    }
  }
} as const;

export async function createBatch(teacherId: string, input: CreateBatchInput) {
  const { service_id, schedule, ...data } = input;

  // 1. Verify service ownership
  const service = await prisma.service.findUnique({
    where: { id: service_id }
  });

  if (!service) throw new Error("SERVICE_NOT_FOUND");
  if (service.teacher_id !== teacherId) throw new Error("FORBIDDEN");

  return prisma.$transaction(async (tx) => {
    // 2. Create the batch
    const batch = await tx.batch.create({
      data: {
        ...data,
        service_id,
        schedule: {
          create: schedule
        }
      }
    });

    // 3. Create Group Chat for the batch
    const chat = await tx.chat.create({
      data: {
        type: CHAT_TYPES.TYPE_OBJECT.BATCH_GROUP as any,
        batch_id: batch.id,
        name: `${service.title} - ${batch.name}`,
        participants: {
          create: {
            user_id: teacherId,
            is_admin: true,
          }
        }
      }
    });

    return tx.batch.findUnique({
      where: { id: batch.id },
      select: safeBatchSelect
    });
  });
}

export async function getBatchList(query: BatchQueryInput) {
  const { page, limit, service_id, teacher_id, status, search } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    ...(service_id && { service_id }),
    ...(teacher_id && { service: { teacher_id } }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    })
  };

  const [batches, total] = await Promise.all([
    prisma.batch.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: safeBatchSelect
    }),
    prisma.batch.count({ where })
  ]);

  return {
    data: batches,
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  };
}

export async function getBatchById(id: string) {
  const batch = await prisma.batch.findUnique({
    where: { id },
    select: safeBatchSelect
  });
  if (!batch) throw new Error("NOT_FOUND");
  return batch;
}

export async function updateBatch(batchId: string, teacherId: string, input: UpdateBatchInput) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { service: true }
  });

  if (!batch) throw new Error("NOT_FOUND");
  if (batch.service.teacher_id !== teacherId) throw new Error("FORBIDDEN");

  const { schedule, ...data } = input;

  return prisma.$transaction(async (tx) => {
    // 1. Update basic fields
    await tx.batch.update({
      where: { id: batchId },
      data: data as any
    });

    // 2. Sync Schedule if provided
    if (schedule) {
      await tx.batchSchedule.deleteMany({ where: { batch_id: batchId } });
      await tx.batchSchedule.createMany({
        data: schedule.map(s => ({ ...s, batch_id: batchId }))
      });
    }

    return tx.batch.findUnique({
      where: { id: batchId },
      select: safeBatchSelect
    });
  });
}

/**
 * Optimized Dropdown API
 */
export async function getBatchesDropdown(query: DropdownQueryInput, context: { teacher_id?: string; service_id?: string }) {
  const { page, limit, search, is_active } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(is_active && { status: BATCH_TYPES.STATUS_OBJECT.ONGOING }), // Or UPCOMING
    ...(context.teacher_id && { service: { teacher_id: context.teacher_id } }),
    ...(context.service_id && { service_id: context.service_id }),
    ...(search && {
      name: { contains: search, mode: "insensitive" as const }
    })
  };

  const [data, total] = await Promise.all([
    prisma.batch.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true // label
      }
    }),
    prisma.batch.count({ where })
  ]);

  return {
    data: data.map(b => ({ id: b.id, label: b.name })),
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get calendar events (batches with schedules for a date range)
 */
export async function getCalendarEvents(userId: string, userRole: string, start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const where: any = {
    status: { in: ["UPCOMING", "ONGOING"] },
    start_date: { lte: endDate },
    OR: [
      { end_date: null },
      { end_date: { gte: startDate } },
    ],
  };

  // Filter by user role
  if (userRole === "TEACHER") {
    where.service = { teacher_id: userId };
  } else if (userRole === "STUDENT") {
    where.enrollments = {
      some: {
        student: { user_id: userId },
        status: { in: ["APPROVED", "PENDING"] },
      },
    };
  }

  const batches = await prisma.batch.findMany({
    where,
    select: {
      id: true,
      name: true,
      start_date: true,
      end_date: true,
      status: true,
      service: {
        select: { title: true, teacher_id: true },
      },
      schedule: {
        select: { day: true, start_time: true, end_time: true },
      },
    },
  });

  // Convert to calendar events
  const events: any[] = [];
  for (const batch of batches) {
    for (const sched of batch.schedule) {
      events.push({
        id: `${batch.id}-${sched.day}`,
        batch_id: batch.id,
        title: `${batch.name} - ${batch.service.title}`,
        day: sched.day,
        start_time: sched.start_time,
        end_time: sched.end_time,
        batch_name: batch.name,
        service_title: batch.service.title,
        status: batch.status,
      });
    }
  }

  return events;
}
