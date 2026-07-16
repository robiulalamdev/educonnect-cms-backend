import { FastifyRequest, FastifyReply } from "fastify";
import {
  createDailyNoteSchema,
  updateDailyNoteSchema,
  dailyNoteQuerySchema,
} from "./daily-note.schema.js";
import {
  createDailyNote,
  getDailyNoteById,
  getDailyNoteList,
  getStudentNotes,
  updateDailyNote,
  deleteDailyNote,
} from "./daily-note.service.js";
import { parseMultipart, MultipartValidationError } from "../../utils/parse-multipart.js";
import { CLD_FOLDERS } from "../../config/cloudinary.js";

export async function createDailyNoteController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { batchId } = req.params as { batchId: string };

  let fields: Record<string, any>;
  let attachmentFiles: import("../../utils/parse-multipart.js").ParsedFile[] = [];

  try {
    const parsed = await parseMultipart(req, {
      allowedFileFields: {
        attachment: { folder: CLD_FOLDERS.NOTE_ATTACHMENTS, maxCount: 3, required: false },
      },
    });
    fields = parsed.fields;
    attachmentFiles = parsed.files["attachment"] ?? [];
  } catch (err) {
    if (err instanceof MultipartValidationError) {
      return reply.status(400).send({ success: false, message: err.message, field: err.field });
    }
    throw err;
  }

  const input = createDailyNoteSchema.parse(fields);
  const attachmentUploads = attachmentFiles.map((f) => ({
    buffer: f.buffer,
    mimetype: f.mimetype,
    originalFilename: f.filename,
    folder: CLD_FOLDERS.NOTE_ATTACHMENTS,
    size: f.size,
  }));

  const data = await createDailyNote(teacherId, batchId, input, attachmentUploads);
  return reply.status(201).send({ success: true, message: "Daily note created", data });
}

export async function getDailyNoteByIdController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const data = await getDailyNoteById(id);
  return reply.send({ success: true, data });
}

export async function getDailyNoteListController(req: FastifyRequest, reply: FastifyReply) {
  const query = dailyNoteQuerySchema.parse(req.query);
  const data = await getDailyNoteList(query);
  return reply.send({ success: true, ...data });
}

export async function getMyNotesController(req: FastifyRequest, reply: FastifyReply) {
  const studentId = req.user!.userId;
  const { batch_id } = req.query as { batch_id?: string };
  const data = await getStudentNotes(studentId, batch_id);
  return reply.send({ success: true, data });
}

export async function updateDailyNoteController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { id } = req.params as { id: string };

  let fields: Record<string, any>;
  let attachmentFiles: import("../../utils/parse-multipart.js").ParsedFile[] = [];

  try {
    const parsed = await parseMultipart(req, {
      allowedFileFields: {
        attachment: { folder: CLD_FOLDERS.NOTE_ATTACHMENTS, maxCount: 3, required: false },
      },
    });
    fields = parsed.fields;
    attachmentFiles = parsed.files["attachment"] ?? [];
  } catch (err) {
    if (err instanceof MultipartValidationError) {
      return reply.status(400).send({ success: false, message: err.message, field: err.field });
    }
    throw err;
  }

  const input = updateDailyNoteSchema.parse(fields);
  const attachmentUploads = attachmentFiles.map((f) => ({
    buffer: f.buffer,
    mimetype: f.mimetype,
    originalFilename: f.filename,
    folder: CLD_FOLDERS.NOTE_ATTACHMENTS,
    size: f.size,
  }));

  const data = await updateDailyNote(teacherId, id, input, attachmentUploads);
  return reply.send({ success: true, message: "Daily note updated", data });
}

export async function deleteDailyNoteController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { id } = req.params as { id: string };
  await deleteDailyNote(teacherId, id);
  return reply.send({ success: true, message: "Daily note deleted" });
}
