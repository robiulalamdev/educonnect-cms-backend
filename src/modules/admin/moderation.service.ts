import { prisma } from "../../config/prisma.js";
import type { ModerationQueryInput } from "./admin.schema.js";

/**
 * Get moderation items (posts + reviews) for admin review
 */
export async function getModerationItems(query: ModerationQueryInput) {
  const { page, limit, type, search } = query;
  const skip = (page - 1) * limit;

  const items: any[] = [];
  let total = 0;

  // Fetch posts if type is "all" or "posts"
  if (type === "all" || type === "posts") {
    const postWhere = {
      deleted_at: null,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { content: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [posts, postCount] = await Promise.all([
      prisma.post.findMany({
        where: postWhere,
        skip: type === "posts" ? skip : 0,
        take: type === "posts" ? limit : 50,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          status: true,
          created_at: true,
          author: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar: { select: { key: true } },
            },
          },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.post.count({ where: postWhere }),
    ]);

    if (type === "posts") {
      return {
        data: posts.map((p) => ({
          ...p,
          item_type: "POST",
          engagement: { likes: p._count.likes, comments: p._count.comments },
        })),
        meta: { total: postCount, page, limit, total_pages: Math.ceil(postCount / limit) },
      };
    }

    items.push(...posts.map((p) => ({
      ...p,
      item_type: "POST",
      engagement: { likes: p._count.likes, comments: p._count.comments },
    })));
    total += postCount;
  }

  // Fetch reviews if type is "all" or "reviews"
  if (type === "all" || type === "reviews") {
    const reviewWhere = {
      ...(search && {
        OR: [
          { comment: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [reviews, reviewCount] = await Promise.all([
      prisma.review.findMany({
        where: reviewWhere,
        skip: type === "reviews" ? skip : 0,
        take: type === "reviews" ? limit : 50,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          rating: true,
          comment: true,
          status: true,
          teacher_reply: true,
          created_at: true,
          reviewer: {
            select: {
              id: true,
              full_name: true,
              avatar: { select: { key: true } },
            },
          },
          service: {
            select: {
              id: true,
              title: true,
              teacher: {
                select: {
                  id: true,
                  full_name: true,
                },
              },
            },
          },
        },
      }),
      prisma.review.count({ where: reviewWhere }),
    ]);

    if (type === "reviews") {
      return {
        data: reviews.map((r) => ({
          ...r,
          item_type: "REVIEW",
        })),
        meta: { total: reviewCount, page, limit, total_pages: Math.ceil(reviewCount / limit) },
      };
    }

    items.push(...reviews.map((r) => ({
      ...r,
      item_type: "REVIEW",
    })));
    total += reviewCount;
  }

  // Sort combined items by date and paginate
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const paginatedItems = items.slice(skip, skip + limit);

  return {
    data: paginatedItems,
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}
