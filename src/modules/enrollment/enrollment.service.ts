import { prisma } from "../../config/prisma.js";
import { 
  CreateEnrollmentInput, 
  SubmitPaymentInput, 
  UpdateEnrollmentStatusInput, 
  UpdatePaymentStatusInput, 
  EnrollmentQueryInput 
} from "./enrollment.schema";
import { ENROLLMENT_TYPES } from "./enrollment.types.js";
import { BATCH_TYPES } from "../batch/batch.types.js";
import { DropdownQueryInput } from "../education/education.schema.js";
import { emailService } from "../shared/email.service.js";
import { notificationService } from "../shared/notification.service.js";
import { socketManager } from "../../config/socket.js";
import { getAdminStats, getTeacherStats } from "../statistics/statistics.service.js";

const safeEnrollmentSelect = {
  id: true,
  status: true,
  enrolled_at: true,
  student_profile_id: true,
  batch_id: true,
  student: {
    select: {
      id: true,
      user: {
        select: {
          id: true,
          full_name: true,
          avatar: { select: { url: true } }
        }
      }
    }
  },
  batch: {
    select: {
      id: true,
      name: true,
      service: {
        select: {
          id: true,
          title: true,
          teacher_id: true
        }
      }
    }
  },
  payment_records: {
    orderBy: { created_at: "desc" as const },
    select: {
      id: true,
      amount: true,
      method: true,
      transaction_id: true,
      status: true,
      created_at: true,
      screenshot: { select: { url: true } }
    }
  }
} as const;

export async function createEnrollment(studentId: string, input: CreateEnrollmentInput) {
  const { batch_id } = input;

  // 1. Check if student is already enrolled or waitlisted
  const existing = await prisma.enrollment.findFirst({
    where: {
      student: { user_id: studentId },
      batch_id
    }
  });

  if (existing) throw new Error("ALREADY_ENROLLED");

  // 1.1 Fetch Student Profile ID
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { user_id: studentId }
  });

  if (!studentProfile) throw new Error("STUDENT_PROFILE_NOT_FOUND");

  // 2. Check batch capacity
  const batch = await prisma.batch.findUnique({
    where: { id: batch_id },
    select: {
      max_students: true,
      enrolled_count: true,
      waitlist_enabled: true,
      status: true
    }
  });

  if (!batch || batch.status === BATCH_TYPES.STATUS_OBJECT.CANCELLED || batch.status === BATCH_TYPES.STATUS_OBJECT.COMPLETED) {
    throw new Error("BATCH_NOT_AVAILABLE");
  }

  let status: any = ENROLLMENT_TYPES.ENROLLMENT_STATUS_OBJECT.PENDING;

  if (batch.enrolled_count >= batch.max_students) {
    if (!batch.waitlist_enabled) throw new Error("BATCH_FULL");
    status = ENROLLMENT_TYPES.ENROLLMENT_STATUS_OBJECT.WAITLISTED;
  }

  return prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.create({
      data: {
        student_profile_id: studentProfile.id,
        batch_id,
        status
      },
      select: safeEnrollmentSelect
    });

    if (status === ENROLLMENT_TYPES.ENROLLMENT_STATUS_OBJECT.WAITLISTED) {
      await tx.batch.update({
        where: { id: batch_id },
        data: { waitlist_count: { increment: 1 } }
      });
    }

    return enrollment;
  });
}

export async function submitPayment(studentId: string, enrollmentId: string, input: SubmitPaymentInput) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { student: true }
  });

  if (!enrollment) throw new Error("ENROLLMENT_NOT_FOUND");
  if (enrollment.student.user_id !== studentId) throw new Error("FORBIDDEN");

  return prisma.paymentRecord.create({
    data: {
      enrollment_id: enrollmentId,
      amount: input.amount,
      method: input.method,
      transaction_id: input.transaction_id,
      screenshot_id: input.screenshot_id,
      status: ENROLLMENT_TYPES.PAYMENT_STATUS_OBJECT.PENDING
    }
  });
}

export async function getEnrollmentList(query: EnrollmentQueryInput) {
  const { page, limit, batch_id, student_id, teacher_id, status } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    ...(batch_id && { batch_id }),
    ...(student_id && { student: { user_id: student_id } }),
    ...(teacher_id && { batch: { service: { teacher_id } } }),
    ...(status && { status })
  };

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { enrolled_at: "desc" },
      select: safeEnrollmentSelect
    }),
    prisma.enrollment.count({ where })
  ]);

  return {
    data: enrollments,
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  };
}

export async function updatePaymentStatus(actorId: string, is_admin: boolean, paymentId: string, input: UpdatePaymentStatusInput) {
  const payment = await prisma.paymentRecord.findUnique({
    where: { id: paymentId },
    include: { 
      enrollment: { 
        include: { 
          batch: { include: { service: true } },
          student: { include: { user: true } }
        } 
      } 
    }
  });

  if (!payment) throw new Error("PAYMENT_NOT_FOUND");
  
  // Authorization: Only admin or the teacher of the service can approve payment
  if (!is_admin && payment.enrollment.batch.service.teacher_id !== actorId) {
    throw new Error("FORBIDDEN");
  }

  return prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.paymentRecord.update({
      where: { id: paymentId },
      data: { status: input.status }
    });

    // If payment is approved, auto-approve enrollment if it was pending
    if (input.status === ENROLLMENT_TYPES.PAYMENT_STATUS_OBJECT.APPROVED && payment.enrollment.status === ENROLLMENT_TYPES.ENROLLMENT_STATUS_OBJECT.PENDING) {
      await tx.enrollment.update({
        where: { id: payment.enrollment_id },
        data: { status: ENROLLMENT_TYPES.ENROLLMENT_STATUS_OBJECT.APPROVED }
      });

      // Increment batch enrolled count
      await tx.batch.update({
        where: { id: payment.enrollment.batch_id },
        data: { enrolled_count: { increment: 1 } }
      });

      // Add student to the batch group chat
      const chat = await tx.chat.findUnique({
        where: { batch_id: payment.enrollment.batch_id }
      });

      if (chat) {
        await tx.chatParticipant.upsert({
          where: { 
            chat_id_user_id: { 
              chat_id: chat.id, 
              user_id: payment.enrollment.student.user_id 
            } 
          },
          update: {}, 
          create: {
            chat_id: chat.id,
            user_id: payment.enrollment.student.user_id
          }
        });
      }
    }

    // ── Post-Transaction Hooks (Background) ──
    if (input.status === ENROLLMENT_TYPES.PAYMENT_STATUS_OBJECT.APPROVED) {
      const studentUser = payment.enrollment.student.user;
      
      // 1. Email Notification
      emailService.sendEnrollmentApprovalEmail(
        studentUser.email, 
        studentUser.full_name, 
        payment.enrollment.batch.name
      ).catch(console.error);

      // 2. Push Notification
      notificationService.sendToUser(
        studentUser.id,
        "Enrollment Approved! 🎉",
        `You are now enrolled in ${payment.enrollment.batch.name}`
      ).catch(console.error);

      // 3. Real-time Dashboard Refresh (Stats)
      getAdminStats().then(stats => {
        socketManager.emitStatsUpdate(stats);
      }).catch(console.error);

      getTeacherStats(payment.enrollment.batch.service.teacher_id).then(stats => {
        socketManager.emitToRoom(`user_${payment.enrollment.batch.service.teacher_id}`, "teacher_stats_updated", stats);
      }).catch(console.error);
    }

    return updatedPayment;
  });
}

/**
 * Optimized Dropdown API
 */
export async function getEnrollmentsDropdown(query: DropdownQueryInput, context: { teacher_id?: string; batch_id?: string }) {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    ...(context.teacher_id && { batch: { service: { teacher_id: context.teacher_id } } }),
    ...(context.batch_id && { batch_id: context.batch_id }),
    ...(search && {
      student: { 
        user: { 
          full_name: { contains: search, mode: "insensitive" } 
        } 
      }
    })
  };

  const [data, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { enrolled_at: "desc" },
      select: {
        id: true,
        student: {
          select: {
            user: { select: { full_name: true } }
          }
        }
      }
    }),
    prisma.enrollment.count({ where })
  ]);

  return {
    data: data.map(e => ({ id: e.id, label: e.student.user.full_name })),
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  };
}
