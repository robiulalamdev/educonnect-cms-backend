import { prisma } from "../../config/prisma.js";
import { CreateServiceInput, UpdateServiceInput, ServiceQueryInput, DropdownQueryInput } from "./service.schema.js";
import { SERVICE_TYPES } from "./service.types.js";
import { ENROLLMENT_TYPES } from "../enrollment/enrollment.types.js";

// ── Optimized Selects ──────────────────────────────────────

const safeServiceSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  format: true,
  mode: true,
  status: true,
  country: true,
  city: true,
  area: true,
  address_line: true,
  meeting_platform: true,
  meeting_link: true,
  joining_fee: true,
  monthly_fee: true,
  per_session_fee: true,
  currency: true,
  average_rating: true,
  total_reviews: true,
  created_at: true,
  teacher: {
    select: {
      id: true,
      full_name: true,
      avatar: {
        select: { key: true }
      }
    }
  },
  subjects: {
    select: {
      subject: {
        select: { id: true, name: true }
      }
    }
  },
  levels: {
    select: {
      level: {
        select: { id: true, name: true }
      }
    }
  },
  payment_methods: {
    select: {
      method: true,
      account_name: true,
      account_number: true,
      instructions: true
    }
  }
} as const;

// ── Service Logic ──────────────────────────────────────────

export async function createService(teacherId: string, input: CreateServiceInput) {
  const { subject_ids, level_ids, payment_methods, ...data } = input;

  // 1. Verify teacher is approved
  const teacher = await prisma.user.findUnique({
    where: { id: teacherId, deleted_at: null },
    select: { is_approved: true, is_email_verified: true },
  });
  if (!teacher) throw new Error("NOT_FOUND");
  if (!teacher.is_approved) throw new Error("TEACHER_NOT_APPROVED");
  if (!teacher.is_email_verified) throw new Error("EMAIL_NOT_VERIFIED");

  // 2. Check subscription limits
  const activeServices = await prisma.service.count({
    where: { teacher_id: teacherId, status: { not: "CLOSED" }, deleted_at: null },
  });

  const subscription = await prisma.userSubscription.findUnique({
    where: { user_id: teacherId },
    include: { package: true },
  });

  const maxServices = subscription?.package?.max_services ?? 1;
  if (activeServices >= maxServices) {
    throw new Error("SUBSCRIPTION_LIMIT_REACHED");
  }

  // Generate unique slug
  let slug = input.title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
  const existing = await prisma.service.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Math.floor(Math.random() * 1000)}`;

  return prisma.service.create({
    data: {
      ...data,
      slug,
      teacher_id: teacherId,
      subjects: {
        create: subject_ids.map(id => ({ subject_id: id }))
      },
      levels: {
        create: level_ids.map(id => ({ level_id: id }))
      },
      payment_methods: {
        create: payment_methods?.map(pm => ({
          method: pm.method as any,
          account_name: pm.account_name,
          account_number: pm.account_number,
          instructions: pm.instructions
        }))
      }
    },
    select: safeServiceSelect
  });
}

export async function getServiceList(query: ServiceQueryInput) {
  const { page, limit, q, teacher_id, subject_id, level_id, format, mode, status, city, area, min_fee, max_fee } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    deleted_at: null,
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ]
    }),
    ...(teacher_id && { teacher_id }),
    ...(status && { status }),
    ...(format && { format }),
    ...(mode && { mode }),
    ...(city && { city }),
    ...(area && { area }),
    ...(subject_id && { subjects: { some: { subject_id } } }),
    ...(level_id && { levels: { some: { level_id } } }),
    ...((min_fee || max_fee) && {
      OR: [
        { monthly_fee: { gte: min_fee, lte: max_fee } },
        { per_session_fee: { gte: min_fee, lte: max_fee } },
      ]
    })
  };

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: safeServiceSelect
    }),
    prisma.service.count({ where })
  ]);

  return {
    data: services,
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  };
}

export async function getServiceById(id: string) {
  const service = await prisma.service.findUnique({
    where: { id },
    select: safeServiceSelect
  });
  if (!service) throw new Error("NOT_FOUND");
  return service;
}

export async function updateService(serviceId: string, teacherId: string, input: UpdateServiceInput) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new Error("NOT_FOUND");
  if (service.teacher_id !== teacherId) throw new Error("FORBIDDEN");

  const { subject_ids, level_ids, payment_methods, ...data } = input;

  return prisma.$transaction(async (tx) => {
    // 1. Update basic fields
    await tx.service.update({
      where: { id: serviceId },
      data: data as any
    });

    // 2. Sync subjects if provided
    if (subject_ids) {
      await tx.serviceSubject.deleteMany({ where: { service_id: serviceId } });
      await tx.serviceSubject.createMany({
        data: subject_ids.map(id => ({ service_id: serviceId, subject_id: id }))
      });
    }

    // 3. Sync levels if provided
    if (level_ids) {
      await tx.serviceLevel.deleteMany({ where: { service_id: serviceId } });
      await tx.serviceLevel.createMany({
        data: level_ids.map(id => ({ service_id: serviceId, level_id: id }))
      });
    }

    // 4. Sync payment methods if provided
    if (payment_methods) {
      await tx.servicePaymentMethod.deleteMany({ where: { service_id: serviceId } });
      await tx.servicePaymentMethod.createMany({
        data: payment_methods.map(pm => ({
          service_id: serviceId,
          method: pm.method as any,
          account_name: pm.account_name,
          account_number: pm.account_number,
          instructions: pm.instructions
        }))
      });
    }

    return tx.service.findUnique({
      where: { id: serviceId },
      select: safeServiceSelect
    });
  });
}

/**
 * Optimized Dropdown API
 */
export async function getServicesDropdown(query: DropdownQueryInput, context: { teacher_id?: string; is_admin?: boolean }) {
  const { page, limit, search, is_active } = query;
  const skip = (page - 1) * limit;

  const where = {
    deleted_at: null,
    ...(is_active && { status: SERVICE_TYPES.STATUS_OBJECT.ACTIVE }),
    ...(context.teacher_id && { teacher_id: context.teacher_id }),
    ...(search && {
      title: { contains: search, mode: "insensitive" as const }
    })
  };

  const [data, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take: limit,
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true // label
      }
    }),
    prisma.service.count({ where })
  ]);

  return {
    data: data.map(s => ({ id: s.id, label: s.title })),
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  };
}
