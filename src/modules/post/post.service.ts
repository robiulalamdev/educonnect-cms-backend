import { prisma } from "../../config/prisma.js";
import { CreatePostInput, UpdatePostInput, PostQueryInput } from "./post.schema.js";
import { POST_TYPES } from "./post.types.js";
import { DropdownQueryInput } from "../education/education.schema.js";
import { uploadToCloudinary, deleteFromCloudinary, type UploadInput } from "../../utils/cloudinary-upload.js";

const safePostSelect = {
  id: true,
  author_id: true,
  type: true,
  status: true,
  title: true,
  content: true,
  service_id: true,
  preferred_mode: true,
  budget_min: true,
  budget_max: true,
  currency: true,
  country: true,
  city: true,
  area: true,
  created_at: true,
  author: {
    select: {
      id: true,
      full_name: true,
      avatar: { select: { key: true } },
    },
  },
  media: {
    select: {
      id: true,
      key: true,
      filename: true,
      mime_type: true,
      type: true,
    },
  },
  subjects: {
    select: {
      subject: { select: { id: true, name: true } },
    },
  },
  levels: {
    select: {
      level: { select: { id: true, name: true } },
    },
  },
} as const;

// Upload files and create Media records, return their IDs
async function uploadMedia(
  uploads: UploadInput[],
  ownerId: string,
  postId: string,
): Promise<string[]> {
  const mediaIds: string[] = [];

  for (const upload of uploads) {
    const result = await uploadToCloudinary(upload);

    const media = await prisma.media.create({
      data: {
        key: result.public_id,
        filename: result.filename,
        mime_type: result.mimetype,
        size: result.size,
        type: result.mimetype.startsWith("image/")
          ? "IMAGE"
          : result.mimetype.startsWith("video/")
            ? "VIDEO"
            : "DOCUMENT",
        width: result.width ?? null,
        height: result.height ?? null,
        owner_type: "POST",
        owner_id: ownerId,
        post_id: postId,
      },
    });

    mediaIds.push(media.id);
  }

  return mediaIds;
}

// Delete old media files from Cloudinary
async function deleteOldMedia(mediaIds: string[]) {
  for (const id of mediaIds) {
    const media = await prisma.media.findUnique({ where: { id } });
    if (media) {
      await deleteFromCloudinary(media.key, media.mime_type).catch(() => {});
      await prisma.media.delete({ where: { id } });
    }
  }
}

export async function createPost(
  authorId: string,
  input: CreatePostInput,
  mediaUploads?: UploadInput[],
) {
  const { media_ids, ...data } = input;

  // Create post first (needed for post_id FK on Media)
  const post = await prisma.post.create({
    data: {
      ...data,
      author_id: authorId,
    },
    select: { id: true },
  });

  // Upload new media files if provided
  if (mediaUploads && mediaUploads.length > 0) {
    const newMediaIds = await uploadMedia(mediaUploads, authorId, post.id);
    // Connect uploaded media
    if (newMediaIds.length > 0) {
      await prisma.post.update({
        where: { id: post.id },
        data: { media: { connect: newMediaIds.map((id) => ({ id })) } },
      });
    }
  }

  // Also connect any pre-uploaded media_ids
  if (media_ids && media_ids.length > 0) {
    await prisma.post.update({
      where: { id: post.id },
      data: { media: { connect: media_ids.map((id) => ({ id })) } },
    });
  }

  return prisma.post.findUnique({ where: { id: post.id }, select: safePostSelect });
}

export async function getPostList(query: PostQueryInput) {
  const { page, limit, type, status, author_id, subject_id, level_id, search, state, city, area, budget_min, budget_max, preferred_mode } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    deleted_at: null,
    ...(type && { type }),
    ...(status && { status }),
    ...(author_id && { author_id }),
    ...(subject_id && { subjects: { some: { subject_id } } }),
    ...(level_id && { levels: { some: { level_id } } }),
    ...(state && { state }),
    ...(city && { city }),
    ...(area && { area }),
    ...(preferred_mode && { preferred_mode }),
    ...((budget_min || budget_max) && {
      OR: [
        { budget_min: { gte: budget_min, lte: budget_max } },
        { budget_max: { gte: budget_min, lte: budget_max } },
      ]
    }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: safePostSelect,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    data: posts,
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}

export async function getPostById(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    select: safePostSelect,
  });
  if (!post) throw new Error("NOT_FOUND");
  if (post.status === "DELETED") throw new Error("NOT_FOUND");
  return post;
}

export async function updatePost(
  postId: string,
  authorId: string,
  input: UpdatePostInput,
  mediaUploads?: UploadInput[],
) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { media: { select: { id: true } } },
  });
  if (!post) throw new Error("NOT_FOUND");
  if (post.author_id !== authorId) throw new Error("FORBIDDEN");

  const { media_ids, ...data } = input;

  // Delete old media if new files are being uploaded
  if (mediaUploads && mediaUploads.length > 0) {
    const oldMediaIds = post.media.map((m) => m.id);
    await deleteOldMedia(oldMediaIds);
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      ...data as any,
      media: media_ids ? { set: media_ids.map((id) => ({ id })) } : undefined,
    },
    select: { id: true },
  });

  // Upload new media files
  if (mediaUploads && mediaUploads.length > 0) {
    const newMediaIds = await uploadMedia(mediaUploads, authorId, postId);
    if (newMediaIds.length > 0) {
      await prisma.post.update({
        where: { id: postId },
        data: { media: { connect: newMediaIds.map((id) => ({ id })) } },
      });
    }
  }

  return prisma.post.findUnique({ where: { id: postId }, select: safePostSelect });
}

export async function getPostsDropdown(query: DropdownQueryInput, context: { author_id?: string }) {
  const { page, limit, search, is_active } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(is_active && { status: POST_TYPES.STATUS_OBJECT.ACTIVE }),
    ...(context.author_id && { author_id: context.author_id }),
    ...(search && {
      title: { contains: search, mode: "insensitive" as const },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    prisma.post.count({ where }),
  ]);

  return {
    data: data.map((p) => ({ id: p.id, label: p.title })),
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}

/**
 * Remove a post (admin action — soft delete)
 */
export async function removePost(postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("NOT_FOUND");

  await prisma.post.update({
    where: { id: postId },
    data: { status: "DELETED", deleted_at: new Date() },
  });
}

export async function getTrendingPosts(limit = 10) {
  const posts = await prisma.post.findMany({
    where: {
      deleted_at: null,
      status: "ACTIVE",
    },
    take: limit * 3,
    orderBy: { created_at: "desc" },
    select: {
      ...safePostSelect,
      _count: { select: { likes: true, comments: true } },
    },
  });

  // Score by engagement: likes * 3 + comments * 2 + recency
  const scored = posts.map((post) => {
    const age = (Date.now() - new Date(post.created_at).getTime()) / 3600000;
    const recency = Math.max(0, 24 - age);
    const score = (post._count.likes || 0) * 3 + (post._count.comments || 0) * 2 + recency;
    return { ...post, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, limit);
}
