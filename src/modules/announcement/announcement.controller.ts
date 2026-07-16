import { FastifyRequest, FastifyReply } from "fastify";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  announcementQuerySchema,
} from "./announcement.schema.js";
import {
  createAnnouncement,
  getAnnouncementById,
  getAnnouncementList,
  updateAnnouncement,
  deleteAnnouncement,
} from "./announcement.service.js";
import { parseMultipart, MultipartValidationError } from "../../utils/parse-multipart.js";
import { CLD_FOLDERS } from "../../config/cloudinary.js";

export async function createAnnouncementController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { batchId } = req.params as { batchId: string };

  let fields: Record<string, any>;
  let mediaFiles: import("../../utils/parse-multipart.js").ParsedFile[] = [];

  try {
    const parsed = await parseMultipart(req, {
      allowedFileFields: {
        media: { folder: CLD_FOLDERS.ANNOUNCEMENT_MEDIA, maxCount: 3, required: false },
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

  const input = createAnnouncementSchema.parse(fields);
  const mediaUploads = mediaFiles.map((f) => ({
    buffer: f.buffer,
    mimetype: f.mimetype,
    originalFilename: f.filename,
    folder: CLD_FOLDERS.ANNOUNCEMENT_MEDIA,
    size: f.size,
  }));

  const data = await createAnnouncement(teacherId, batchId, input, mediaUploads);
  return reply.status(201).send({ success: true, message: "Announcement created", data });
}

export async function getAnnouncementByIdController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const data = await getAnnouncementById(id);
  return reply.send({ success: true, data });
}

export async function getAnnouncementListController(req: FastifyRequest, reply: FastifyReply) {
  const query = announcementQuerySchema.parse(req.query);
  const data = await getAnnouncementList(query);
  return reply.send({ success: true, ...data });
}

export async function updateAnnouncementController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { id } = req.params as { id: string };

  let fields: Record<string, any>;
  let mediaFiles: import("../../utils/parse-multipart.js").ParsedFile[] = [];

  try {
    const parsed = await parseMultipart(req, {
      allowedFileFields: {
        media: { folder: CLD_FOLDERS.ANNOUNCEMENT_MEDIA, maxCount: 3, required: false },
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

  const input = updateAnnouncementSchema.parse(fields);
  const mediaUploads = mediaFiles.map((f) => ({
    buffer: f.buffer,
    mimetype: f.mimetype,
    originalFilename: f.filename,
    folder: CLD_FOLDERS.ANNOUNCEMENT_MEDIA,
    size: f.size,
  }));

  const data = await updateAnnouncement(teacherId, id, input, mediaUploads);
  return reply.send({ success: true, message: "Announcement updated", data });
}

export async function deleteAnnouncementController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { id } = req.params as { id: string };
  await deleteAnnouncement(teacherId, id);
  return reply.send({ success: true, message: "Announcement deleted" });
}
