import { prisma } from "../../config/prisma.js";
import { CreatePostInput, UpdatePostInput, PostQueryInput } from "./post.schema.js";
import { POST_TYPES } from "./post.types.js";
import { DropdownQueryInput } from "../education/education.schema.js";

const safePostSelect = {
  id: true,
  author_id: true,
  type: true,
  status: true,
  title: true,
  content: true,
  service_id: true,
  level_id: true,
  subject_id: true,
  created_at: true,
  author: {
    select: {
      id: true,
      full_name: true,
      avatar: { select: { key: true } }
    }
  },
  media: {
    select: {
      id: true,
      url: true,
      type: true
    }
  },
  level: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true } }
} as const;

export async function createPost(authorId: string, input: CreatePostInput) {
  const { media_ids, ...data } = input;

  return prisma.post.create({
    data: {
      ...data,
      author_id: authorId,
      media: {
        connect: media_ids?.map(id => ({ id })) || []
      }
    },
    select: safePostSelect
  });
}

export async function getPostList(query: PostQueryInput) {
  const { page, limit, type, status, author_id, subject_id, level_id, search } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    ...(type && { type }),
    ...(status && { status }),
    ...(author_id && { author_id }),
    ...(subject_id && { subject_id }),
    ...(level_id && { level_id }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ]
    })
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: safePostSelect
    }),
    prisma.post.count({ where })
  ]);

  return {
    data: posts,
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  };
}

export async function getPostById(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    select: safePostSelect
  });
  if (!post) throw new Error("NOT_FOUND");
  return post;
}

export async function updatePost(postId: string, authorId: string, input: UpdatePostInput) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("NOT_FOUND");
  if (post.author_id !== authorId) throw new Error("FORBIDDEN");

  const { media_ids, ...data } = input;

  return prisma.post.update({
    where: { id: postId },
    data: {
      ...data as any,
      media: {
        set: media_ids?.map(id => ({ id })) || []
      }
    },
    select: safePostSelect
  });
}

/**
 * Optimized Dropdown API
 */
export async function getPostsDropdown(query: DropdownQueryInput, context: { author_id?: string }) {
  const { page, limit, search, is_active } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(is_active && { status: POST_TYPES.STATUS_OBJECT.ACTIVE }),
    ...(context.author_id && { author_id: context.author_id }),
    ...(search && {
      title: { contains: search, mode: "insensitive" as const }
    })
  };

  const [data, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true // label
      }
    }),
    prisma.post.count({ where })
  ]);

  return {
    data: data.map(p => ({ id: p.id, label: p.title })),
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  };
}
