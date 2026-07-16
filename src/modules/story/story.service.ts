import { prisma } from "../../config/prisma.js";
import type { CreateStoryInput, StoryQueryInput } from "./story.schema.js";
import type { UploadInput } from "../../utils/cloudinary-upload.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary-upload.js";

const EXPIRY_HOURS = 24;

const safeStorySelect = {
  id: true,
  content: true,
  media_type: true,
  bg_color: true,
  expires_at: true,
  created_at: true,
  user: {
    select: { id: true, full_name: true, avatar: { select: { key: true } } },
  },
  media: {
    select: { id: true, key: true, mime_type: true, type: true },
  },
  _count: { select: { views: true } },
};

export async function createStory(userId: string, input: CreateStoryInput, mediaUpload?: UploadInput) {
  let mediaId: string | null = null;

  if (mediaUpload) {
    const result = await uploadToCloudinary(mediaUpload);
    const media = await prisma.media.create({
      data: {
        key: result.public_id,
        filename: mediaUpload.originalFilename,
        mime_type: mediaUpload.mimetype,
        size: mediaUpload.size,
        type: result.url.includes("video") ? "VIDEO" : "IMAGE",
        owner_type: "TEACHER", // Will be overridden based on user role
        owner_id: userId,
        uploaded_by_id: userId,
        uploaded_by_type: "USER",
      },
    });
    mediaId = media.id;
  }

  const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);

  const story = await prisma.story.create({
    data: {
      user_id: userId,
      content: input.content || null,
      media_id: mediaId,
      media_type: input.media_type || (mediaUpload ? (mediaUpload.mimetype.startsWith("video/") ? "VIDEO" : "IMAGE") : null),
      bg_color: input.bg_color || null,
      expires_at: expiresAt,
    },
    select: safeStorySelect,
  });

  return story;
}

export async function getStoriesFeed(userId: string, query: StoryQueryInput) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  // Get stories from users that the current user follows + own stories
  // For now, get all active stories (not expired, not deleted by user)
  const stories = await prisma.story.findMany({
    where: {
      expires_at: { gt: new Date() },
    },
    select: {
      ...safeStorySelect,
      views: { select: { user_id: true }, where: { user_id: userId } },
    },
    orderBy: { created_at: "desc" },
    skip,
    take: limit,
  });

  // Group by user and mark viewed
  const grouped: Record<string, any> = {};
  for (const story of stories) {
    const uid = story.user.id;
    if (!grouped[uid]) {
      grouped[uid] = {
        user: story.user,
        stories: [],
        has_unviewed: false,
      };
    }
    const isViewed = story.views.length > 0;
    grouped[uid].stories.push({
      ...story,
      is_viewed: isViewed,
    });
    if (!isViewed) grouped[uid].has_unviewed = true;
  }

  // Sort: unviewed first, then by most recent
  const result = Object.values(grouped).sort((a: any, b: any) => {
    if (a.has_unviewed && !b.has_unviewed) return -1;
    if (!a.has_unviewed && b.has_unviewed) return 1;
    return new Date(b.stories[0].created_at).getTime() - new Date(a.stories[0].created_at).getTime();
  });

  return { data: result };
}

export async function getUserStories(userId: string) {
  const stories = await prisma.story.findMany({
    where: {
      user_id: userId,
      expires_at: { gt: new Date() },
    },
    select: safeStorySelect,
    orderBy: { created_at: "asc" },
  });

  return stories;
}

export async function viewStory(storyId: string, userId: string) {
  const story = await prisma.story.findUnique({ where: { id: storyId } });
  if (!story) throw new Error("NOT_FOUND");
  if (story.expires_at < new Date()) throw new Error("STORY_EXPIRED");

  // Create view record (ignore if already viewed)
  await prisma.storyView.upsert({
    where: { story_id_user_id: { story_id: storyId, user_id: userId } },
    create: { story_id: storyId, user_id: userId },
    update: { viewed_at: new Date() },
  });

  return { viewed: true };
}

export async function getStoryViewers(storyId: string, userId: string) {
  const story = await prisma.story.findUnique({ where: { id: storyId } });
  if (!story) throw new Error("NOT_FOUND");
  if (story.user_id !== userId) throw new Error("FORBIDDEN");

  const views = await prisma.storyView.findMany({
    where: { story_id: storyId },
    select: {
      user: { select: { id: true, full_name: true, avatar: { select: { key: true } } } },
      viewed_at: true,
    },
    orderBy: { viewed_at: "desc" },
  });

  return views;
}

export async function deleteStory(storyId: string, userId: string) {
  const story = await prisma.story.findUnique({ where: { id: storyId } });
  if (!story) throw new Error("NOT_FOUND");
  if (story.user_id !== userId) throw new Error("FORBIDDEN");

  // Delete media from Cloudinary if exists
  if (story.media_id) {
    const media = await prisma.media.findUnique({ where: { id: story.media_id } });
    if (media) {
      await deleteFromCloudinary(media.key, media.mime_type).catch(() => {});
      await prisma.media.delete({ where: { id: media.id } }).catch(() => {});
    }
  }

  await prisma.story.delete({ where: { id: storyId } });
}

// Cleanup expired stories (call periodically)
export async function cleanupExpiredStories() {
  const result = await prisma.story.deleteMany({
    where: { expires_at: { lt: new Date() } },
  });
  return result.count;
}
