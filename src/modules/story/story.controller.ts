import { FastifyRequest, FastifyReply } from "fastify";
import { createStorySchema, storyQuerySchema } from "./story.schema.js";
import {
  createStory,
  getStoriesFeed,
  getUserStories,
  viewStory,
  getStoryViewers,
  deleteStory,
} from "./story.service.js";
import { parseMultipart, MultipartValidationError } from "../../utils/parse-multipart.js";
import { CLD_FOLDERS } from "../../config/cloudinary.js";
import type { UploadInput } from "../../utils/cloudinary-upload.js";
import { socketManager } from "../../config/socket.js";

export async function createStoryController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;

  let fields: Record<string, any>;
  let mediaFile: import("../../utils/parse-multipart.js").ParsedFile | undefined;

  try {
    const parsed = await parseMultipart(req, {
      allowedFileFields: {
        media: { folder: CLD_FOLDERS.POST_MEDIA, maxCount: 1, required: false },
      },
    });
    fields = parsed.fields;
    mediaFile = parsed.file;
  } catch (err) {
    if (err instanceof MultipartValidationError) {
      return reply.status(400).send({ success: false, message: err.message, field: err.field });
    }
    throw err;
  }

  const body = createStorySchema.parse(fields);

  let mediaUpload: UploadInput | undefined;
  if (mediaFile) {
    mediaUpload = {
      buffer: mediaFile.buffer,
      mimetype: mediaFile.mimetype,
      originalFilename: mediaFile.filename,
      folder: CLD_FOLDERS.POST_MEDIA,
      size: mediaFile.size,
    };
  }

  const story = await createStory(userId, body, mediaUpload);

  // Emit real-time event to followers
  socketManager.emitToRoom("stories_feed", "new_story", {
    userId,
    storyId: story.id,
  });

  return reply.status(201).send({ success: true, data: story });
}

export async function getStoriesFeedController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const result = await getStoriesFeed(userId, { page: 1, limit: 100 });
  return reply.send({ success: true, ...result });
}

export async function getUserStoriesController(req: FastifyRequest, reply: FastifyReply) {
  const { userId } = req.params as { userId: string };
  const stories = await getUserStories(userId);
  return reply.send({ success: true, data: stories });
}

export async function viewStoryController(req: FastifyRequest, reply: FastifyReply) {
  const { storyId } = req.params as { storyId: string };
  const userId = req.user!.userId;

  await viewStory(storyId, userId);
  return reply.send({ success: true });
}

export async function getStoryViewersController(req: FastifyRequest, reply: FastifyReply) {
  const { storyId } = req.params as { storyId: string };
  const userId = req.user!.userId;

  const viewers = await getStoryViewers(storyId, userId);
  return reply.send({ success: true, data: viewers });
}

export async function deleteStoryController(req: FastifyRequest, reply: FastifyReply) {
  const { storyId } = req.params as { storyId: string };
  const userId = req.user!.userId;

  await deleteStory(storyId, userId);
  return reply.send({ success: true, message: "Story deleted" });
}
