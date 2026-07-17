import { prisma } from "../../config/prisma.js";
import type { PaymentListQueryInput } from "./payment.schema.js";

const safePaymentSelect = {
  id: true,
  amount: true,
  currency: true,
  method: true,
  transaction_id: true,
  sender_name: true,
  sender_number: true,
  note: true,
  payment_for: true,
  status: true,
  rejection_note: true,
  reviewed_at: true,
  created_at: true,
  updated_at: true,
  enrollment: {
    select: {
      id: true,
      batch: {
        select: {
          id: true,
          name: true,
          service: {
            select: {
              id: true,
              title: true,
              teacher_id: true,
              currency: true,
            },
          },
        },
      },
      student: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar: { select: { key: true } },
            },
          },
        },
      },
    },
  },
  screenshot: {
    select: {
      id: true,
      key: true,
      filename: true,
      mime_type: true,
    },
  },
} as const;

/**
 * List payment records with filters (admin view)
 */
export async function getPaymentList(query: PaymentListQueryInput) {
  const { page, limit, status, method, batch_id, student_id, teacher_id, search } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    ...(status && { status }),
    ...(method && { method }),
    ...(batch_id && { enrollment: { batch_id } }),
    ...(student_id && { enrollment: { student: { user_id: student_id } } }),
    ...(teacher_id && {
      enrollment: { batch: { service: { teacher_id } } },
    }),
    ...(search && {
      OR: [
        { transaction_id: { contains: search, mode: "insensitive" } },
        { sender_name: { contains: search, mode: "insensitive" } },
        { enrollment: { student: { user: { full_name: { contains: search, mode: "insensitive" } } } } },
      ],
    }),
  };

  const [payments, total] = await Promise.all([
    prisma.paymentRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: safePaymentSelect,
    }),
    prisma.paymentRecord.count({ where }),
  ]);

  return {
    data: payments,
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      has_next: page * limit < total,
    },
  };
}

/**
 * Get payment record by ID
 */
export async function getPaymentById(paymentId: string) {
  const payment = await prisma.paymentRecord.findUnique({
    where: { id: paymentId },
    select: safePaymentSelect,
  });

  if (!payment) throw new Error("NOT_FOUND");
  return payment;
}

/**
 * Get payment history for a student
 */
export async function getStudentPaymentHistory(
  studentUserId: string,
  page: number = 1,
  limit: number = 20,
) {
  const skip = (page - 1) * limit;

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { user_id: studentUserId },
  });

  if (!studentProfile) throw new Error("STUDENT_PROFILE_NOT_FOUND");

  const where = {
    enrollment: { student_profile_id: studentProfile.id },
  };

  const [payments, total] = await Promise.all([
    prisma.paymentRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: safePaymentSelect,
    }),
    prisma.paymentRecord.count({ where }),
  ]);

  return {
    data: payments,
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      has_next: page * limit < total,
    },
  };
}

/**
 * Get payment stats summary
 */
export async function getPaymentStats(teacherId?: string) {
  const baseWhere = teacherId
    ? { enrollment: { batch: { service: { teacher_id: teacherId } } } }
    : {};

  const [totalPayments, pendingPayments, approvedPayments, rejectedPayments, totalAmount] =
    await Promise.all([
      prisma.paymentRecord.count({ where: baseWhere }),
      prisma.paymentRecord.count({ where: { ...baseWhere, status: "PENDING" } }),
      prisma.paymentRecord.count({ where: { ...baseWhere, status: "APPROVED" } }),
      prisma.paymentRecord.count({ where: { ...baseWhere, status: "REJECTED" } }),
      prisma.paymentRecord.aggregate({
        where: { ...baseWhere, status: "APPROVED" },
        _sum: { amount: true },
      }),
    ]);

  return {
    total_payments: totalPayments,
    pending: pendingPayments,
    approved: approvedPayments,
    rejected: rejectedPayments,
    total_collected: Number(totalAmount._sum.amount ?? 0),
  };
}
