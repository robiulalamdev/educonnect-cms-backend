import { FastifyRequest, FastifyReply } from "fastify";
import {
  createPostSchema,
  updatePostSchema,
  postQuerySchema,
} from "./post.schema.js";
import {
  createPost,
  getPostList,
  getPostById,
  updatePost,
  getPostsDropdown,
} from "./post.service.js";
import { dropdownQuerySchema } from "../education/education.schema.js";
import { POST_TYPES } from "./post.types.js";
import { parseMultipart, MultipartValidationError } from "../../utils/parse-multipart.js";
import { CLD_FOLDERS } from "../../config/cloudinary.js";

export async function createPostController(req: FastifyRequest, reply: FastifyReply) {
  const authorId = req.user!.userId;

  let fields: Record<string, any>;
  let mediaFiles: import("../../utils/parse-multipart.js").ParsedFile[] = [];

  try {
    const parsed = await parseMultipart(req, {
      allowedFileFields: {
        media: { folder: CLD_FOLDERS.POST_MEDIA, maxCount: 5, required: false },
      },
    });
    fields = parsed.fields;
    mediaFiles = parsed.files["media"] ?? [];
  } catch (err) {
    if (err instanceof MultipartValidationError) {
      return reply.status(400).send({ success: false, message: err.message, field: err.field });
    }
    throw err;
  }

  const input = createPostSchema.parse(fields);

  // Build upload inputs from files
  const mediaUploads = mediaFiles.map((f) => ({
    buffer: f.buffer,
    mimetype: f.mimetype,
    originalFilename: f.filename,
    folder: CLD_FOLDERS.POST_MEDIA,
    size: f.size,
  }));

  const data = await createPost(authorId, input, mediaUploads);
  return reply.send({ success: true, message: "Post created successfully", data });
}

export async function getPostFeedController(req: FastifyRequest, reply: FastifyReply) {
  const query = postQuerySchema.parse(req.query);
  const data = await getPostList({ ...query, status: POST_TYPES.STATUS_OBJECT.ACTIVE });
  return reply.send({ success: true, ...data });
}

export async function getMyPostsController(req: FastifyRequest, reply: FastifyReply) {
  const authorId = req.user!.userId;
  const query = postQuerySchema.parse(req.query);
  const data = await getPostList({ ...query, author_id: authorId });
  return reply.send({ success: true, ...data });
}

export async function getAdminPostsController(req: FastifyRequest, reply: FastifyReply) {
  const query = postQuerySchema.parse(req.query);
  const data = await getPostList(query);
  return reply.send({ success: true, ...data });
}

export async function getPostByIdController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const data = await getPostById(id);
  return reply.send({ success: true, data });
}

export async function updatePostController(req: FastifyRequest, reply: FastifyReply) {
  const authorId = req.user!.userId;
  const { id } = req.params as { id: string };

  let fields: Record<string, any>;
  let mediaFiles: import("../../utils/parse-multipart.js").ParsedFile[] = [];

  try {
    const parsed = await parseMultipart(req, {
      allowedFileFields: {
        media: { folder: CLD_FOLDERS.POST_MEDIA, maxCount: 5, required: false },
      },
    });
    fields = parsed.fields;
    mediaFiles = parsed.files["media"] ?? [];
  } catch (err) {
    if (err instanceof MultipartValidationError) {
      return reply.status(400).send({ success: false, message: err.message, field: err.field });
    }
    throw err;
  }

  const input = updatePostSchema.parse(fields);

  const mediaUploads = mediaFiles.map((f) => ({
    buffer: f.buffer,
    mimetype: f.mimetype,
    originalFilename: f.filename,
    folder: CLD_FOLDERS.POST_MEDIA,
    size: f.size,
  }));

  const data = await updatePost(id, authorId, input, mediaUploads);
  return reply.send({ success: true, message: "Post updated successfully", data });
}

export async function getPostsDropdownController(req: FastifyRequest, reply: FastifyReply) {
  const query = dropdownQuerySchema.parse(req.query);
  const context = { author_id: req.user?.userId };
  const data = await getPostsDropdown(query, context);
  return reply.send({ success: true, ...data });
}
