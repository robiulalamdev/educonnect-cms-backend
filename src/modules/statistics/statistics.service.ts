import { prisma } from "../../config/prisma.js";
import { ENROLLMENT_TYPES } from "../enrollment/enrollment.types.js";
import { BATCH_TYPES } from "../batch/batch.types.js";

// Note: Using dot-notation types for internal logic checks where applicable
// and raw Prisma types for the DB queries themselves.

export async function getAdminStats() {
  const results: any[] = await Promise.all([
    // 1. Users by Role
    prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
      where: { deleted_at: null }
    }),

    // 2. Enrollments by Status
    prisma.enrollment.groupBy({
      by: ["status"],
      _count: { id: true }
    }),

    // 3. Financial Overview
    prisma.paymentRecord.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: { status: ENROLLMENT_TYPES.PAYMENT_STATUS_OBJECT.APPROVED as any }
    }) as any,

    // 4. Content Totals
    Promise.all([
      prisma.service.count({ where: { deleted_at: null } }),
      prisma.batch.count()
    ])
  ]);

  const [userGroups, enrollmentGroups, financialStats, contentStats] = results;

  return {
    users: (userGroups as any[]).reduce((acc: any, curr: any) => {
      acc[curr.role] = curr._count?.id || 0;
      return acc;
    }, {}),
    enrollments: (enrollmentGroups as any[]).reduce((acc: any, curr: any) => {
      acc[curr.status] = curr._count?.id || 0;
      return acc;
    }, {}),
    revenue: {
      total_approved: (financialStats as any)._sum?.amount || 0,
      count: (financialStats as any)._count?.id || 0
    },
    counts: {
      services: contentStats[0],
      batches: contentStats[1]
    }
  };
}

export async function getTeacherStats(teacherId: string) {
  const [
    batchStats,
    studentStats,
    pendingActions
  ] = await Promise.all([
    // 1. Batch distribution
    prisma.batch.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { 
        service: { teacher_id: teacherId }
      }
    }),

    // 2. Total unique students
    prisma.enrollment.count({
      where: {
        batch: { service: { teacher_id: teacherId } },
        status: ENROLLMENT_TYPES.ENROLLMENT_STATUS_OBJECT.APPROVED as any
      }
    }),

    // 3. Pending approvals
    Promise.all([
      prisma.enrollment.count({
        where: {
          batch: { service: { teacher_id: teacherId } },
          status: ENROLLMENT_TYPES.ENROLLMENT_STATUS_OBJECT.PENDING as any
        }
      }),
      prisma.paymentRecord.count({
        where: {
          enrollment: { batch: { service: { teacher_id: teacherId } } },
          status: ENROLLMENT_TYPES.PAYMENT_STATUS_OBJECT.PENDING as any
        }
      })
    ])
  ]);

  // Financial Earnings
  const earnings = await prisma.paymentRecord.aggregate({
    _sum: { amount: true },
    where: {
      status: ENROLLMENT_TYPES.PAYMENT_STATUS_OBJECT.APPROVED as any,
      enrollment: { 
        batch: { 
          service: { teacher_id: teacherId } 
        } 
      }
    }
  }) as any;

  return {
    batches: (batchStats as any[]).reduce((acc: any, curr: any) => {
      acc[curr.status] = curr._count?.id || 0;
      return acc;
    }, {}),
    total_students: studentStats,
    earnings: earnings._sum.amount || 0,
    pending: {
      enrollments: pendingActions[0],
      payments: pendingActions[1]
    }
  };
}

export async function getStudentStats(studentId: string) {
  const [
    enrollmentGroups,
    financialStats
  ]: any[] = await Promise.all([
    prisma.enrollment.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { student: { user_id: studentId } }
    }),
    prisma.paymentRecord.aggregate({
      _sum: { amount: true },
      where: {
        enrollment: { student: { user_id: studentId } },
        status: ENROLLMENT_TYPES.PAYMENT_STATUS_OBJECT.APPROVED as any
      }
    }) as any
  ]);

  return {
    courses: (enrollmentGroups as any[]).reduce((acc: any, curr: any) => {
      acc[curr.status] = curr._count?.id || 0;
      return acc;
    }, {}),
    total_paid: (financialStats as any)._sum?.amount || 0
  };
}

export async function getGuardianStats(guardianId: string) {
  // Find wards via the GuardianProfile -> GuardianStudent relation
  const guardianProfile = await prisma.guardianProfile.findUnique({
    where: { user_id: guardianId },
    include: {
      children: {
        where: { status: "APPROVED" as any }, // Only confirmed links
        include: {
          student: {
            include: {
              user: { select: { id: true, full_name: true } },
              _count: {
                select: { enrollments: { where: { status: ENROLLMENT_TYPES.ENROLLMENT_STATUS_OBJECT.APPROVED as any } } }
              }
            }
          }
        }
      }
    }
  });

  if (!guardianProfile) return { wards: [], total_paid: 0 };

  // Consolidated payments for all wards
  const totalPaid = await prisma.paymentRecord.aggregate({
    _sum: { amount: true },
    where: {
      status: ENROLLMENT_TYPES.PAYMENT_STATUS_OBJECT.APPROVED as any,
      enrollment: {
        student: {
          guardian_links: {
            some: { guardian: { user_id: guardianId } }
          }
        }
      }
    }
  }) as any;

  return {
    wards: guardianProfile.children.map(link => ({
      id: link.student.user.id,
      name: link.student.user.full_name,
      active_courses: link.student._count.enrollments
    })),
    total_paid: totalPaid._sum?.amount || 0
  };
}
