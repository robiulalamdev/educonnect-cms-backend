import { prisma } from "../../config/prisma.js";
import { CreateReviewInput, ReplyReviewInput, ReviewQueryInput } from "./review.schema.js";

const safeReviewSelect = {
  id: true,
  service_id: true,
  reviewer_id: true,
  enrollment_id: true,
  rating: true,
  comment: true,
  status: true,
  teacher_reply: true,
  teacher_replied_at: true,
  created_at: true,
  reviewer: {
    select: { id: true, full_name: true, avatar: { select: { key: true } } },
  },
  service: {
    select: { id: true, title: true, teacher_id: true },
  },
} as const;

export async function createReview(studentId: string, input: CreateReviewInput) {
  const { enrollment_id, rating, comment } = input;

  // Verify enrollment exists and belongs to student
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollment_id },
    include: { student: true, batch: { include: { service: true } } },
  });

  if (!enrollment) throw new Error("ENROLLMENT_NOT_FOUND");
  if (enrollment.student.user_id !== studentId) throw new Error("FORBIDDEN");

  // Check if already reviewed
  const existingReview = await prisma.review.findFirst({
    where: { service_id: enrollment.batch.service_id, reviewer_id: studentId },
  });
  if (existingReview) throw new Error("ALREADY_REVIEWED");

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        service_id: enrollment.batch.service_id,
        reviewer_id: studentId,
        enrollment_id,
        rating,
        comment,
      },
      select: safeReviewSelect,
    });

    // Update service average rating
    const stats = await tx.review.aggregate({
      where: { service_id: enrollment.batch.service_id, status: "VISIBLE" },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.service.update({
      where: { id: enrollment.batch.service_id },
      data: {
        average_rating: stats._avg.rating ?? 0,
        total_reviews: stats._count.rating,
      },
    });

    // Update teacher profile average rating
    const teacherStats = await tx.review.aggregate({
      where: {
        service: { teacher_id: enrollment.batch.service.teacher_id },
        status: "VISIBLE",
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.teacherProfile.update({
      where: { user_id: enrollment.batch.service.teacher_id },
      data: {
        average_rating: teacherStats._avg.rating ?? 0,
        total_reviews: teacherStats._count.rating,
      },
    });

    return review;
  });
}

export async function replyToReview(teacherId: string, reviewId: string, input: ReplyReviewInput) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { service: true },
  });

  if (!review) throw new Error("NOT_FOUND");
  if (review.service.teacher_id !== teacherId) throw new Error("FORBIDDEN");
  if (review.teacher_reply) throw new Error("ALREADY_REPLIED");

  return prisma.review.update({
    where: { id: reviewId },
    data: {
      teacher_reply: input.teacher_reply,
      teacher_replied_at: new Date(),
    },
    select: safeReviewSelect,
  });
}

export async function getReviewList(query: ReviewQueryInput) {
  const { page, limit, service_id, teacher_id, status } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    ...(service_id && { service_id }),
    ...(teacher_id && { service: { teacher_id } }),
    ...(status && { status }),
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: safeReviewSelect,
    }),
    prisma.review.count({ where }),
  ]);

  return {
    data: reviews,
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}

export async function hideReview(adminId: string, reviewId: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error("NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({
      where: { id: reviewId },
      data: { status: "HIDDEN" },
      select: safeReviewSelect,
    });

    // Recalculate service rating (exclude hidden)
    const stats = await tx.review.aggregate({
      where: { service_id: review.service_id, status: "VISIBLE" },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.service.update({
      where: { id: review.service_id },
      data: {
        average_rating: stats._avg.rating ?? 0,
        total_reviews: stats._count.rating,
      },
    });

    return updated;
  });
}
