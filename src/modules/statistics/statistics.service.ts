import { prisma } from "../../config/prisma.js";
import { ENROLLMENT_TYPES } from "../enrollment/enrollment.types.js";

export async function getAdminStats() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

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
      where: { status: "APPROVED" as any }
    }) as any,

    // 4. Content Totals
    Promise.all([
      prisma.service.count({ where: { deleted_at: null } }),
      prisma.batch.count(),
      prisma.post.count({ where: { deleted_at: null } }),
      prisma.review.count(),
    ]),

    // 5. Monthly user signups (last 12 months)
    prisma.user.findMany({
      where: { deleted_at: null, created_at: { gte: twelveMonthsAgo } },
      select: { created_at: true, role: true },
    }),

    // 6. Pending approvals
    prisma.user.count({ where: { deleted_at: null, is_approved: false, role: "TEACHER" } }),

    // 7. Teachers by approval status
    prisma.user.groupBy({
      by: ["is_approved"],
      _count: { id: true },
      where: { deleted_at: null, role: "TEACHER" }
    }),

    // 8. Users by status
    prisma.user.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { deleted_at: null }
    }),

    // 9. Posts by type
    prisma.post.groupBy({
      by: ["type"],
      _count: { id: true },
      where: { deleted_at: null }
    }),

    // 10. Recent audit logs
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { created_at: "desc" },
      include: { admin: { select: { full_name: true } } },
    }),

    // 11. Monthly revenue (last 12 months)
    prisma.paymentRecord.findMany({
      where: { status: "APPROVED" as any, created_at: { gte: twelveMonthsAgo } },
      select: { amount: true, created_at: true },
    }),

    // 12. Top teachers by rating
    prisma.teacherProfile.findMany({
      take: 6,
      where: { average_rating: { gt: 0 } },
      orderBy: { average_rating: "desc" },
      include: {
        user: { select: { id: true, full_name: true, email: true, avatar: { select: { key: true } } } },
      },
    }),

    // 13. Recent users
    prisma.user.findMany({
      take: 5,
      where: { deleted_at: null },
      orderBy: { created_at: "desc" },
      select: { id: true, full_name: true, email: true, role: true, status: true, created_at: true, avatar: { select: { key: true } } },
    }),
  ]);

  const [userGroups, enrollmentGroups, financialStats, contentStats, monthlyUsers, pendingApprovals, teacherApprovalGroups, userStatusGroups, postTypeGroups, recentLogs, monthlyPayments, topTeachers, recentUsers] = results;

  // Process monthly growth data (12 months)
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyGrowth: Record<string, { teachers: number; students: number; guardians: number; total: number }> = {};
  const monthlyRevenue: Record<string, number> = {};

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyGrowth[key] = { teachers: 0, students: 0, guardians: 0, total: 0 };
    monthlyRevenue[key] = 0;
  }

  (monthlyUsers as any[]).forEach((u: any) => {
    const d = new Date(u.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyGrowth[key]) {
      monthlyGrowth[key].total++;
      const roleKey = (u.role?.toLowerCase() + "s") as string;
      if (roleKey in monthlyGrowth[key]) {
        (monthlyGrowth[key] as any)[roleKey]++;
      }
    }
  });

  (monthlyPayments as any[]).forEach((p: any) => {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyRevenue[key] !== undefined) {
      monthlyRevenue[key] += Number(p.amount) || 0;
    }
  });

  const monthlyChartData = Object.entries(monthlyGrowth).map(([key, val]) => {
    const [year, month] = key.split("-");
    return {
      name: monthLabels[parseInt(month) - 1],
      teachers: val.teachers,
      students: val.students,
      guardians: val.guardians,
      total: val.total,
      revenue: Math.round(monthlyRevenue[key] * 100) / 100,
    };
  });

  const enrollmentBreakdown = (enrollmentGroups as any[]).reduce((acc: any, curr: any) => {
    acc[curr.status] = curr._count?.id || 0;
    return acc;
  }, {});

  const userStatusBreakdown = (userStatusGroups as any[]).reduce((acc: any, curr: any) => {
    acc[curr.status] = curr._count?.id || 0;
    return acc;
  }, {});

  const postBreakdown = (postTypeGroups as any[]).reduce((acc: any, curr: any) => {
    acc[curr.type] = curr._count?.id || 0;
    return acc;
  }, {});

  return {
    users: (userGroups as any[]).reduce((acc: any, curr: any) => {
      acc[curr.role] = curr._count?.id || 0;
      return acc;
    }, {}),
    userStatus: userStatusBreakdown,
    enrollments: enrollmentBreakdown,
    revenue: {
      total_approved: (financialStats as any)._sum?.amount || 0,
      count: (financialStats as any)._count?.id || 0
    },
    counts: {
      services: contentStats[0],
      batches: contentStats[1],
      posts: contentStats[2],
      reviews: contentStats[3],
    },
    pending_approvals: pendingApprovals,
    monthlyGrowth: monthlyChartData,
    postBreakdown,
    recentActivity: recentLogs,
    topTeachers,
    recentUsers,
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
