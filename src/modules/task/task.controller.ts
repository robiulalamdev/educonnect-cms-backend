import { FastifyRequest, FastifyReply } from "fastify";
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
} from "./task.schema.js";
import {
  createTask,
  getTaskById,
  getTaskList,
  getStudentTasks,
  updateTask,
  deleteTask,
} from "./task.service.js";
import { parseMultipart, MultipartValidationError } from "../../utils/parse-multipart.js";
import { CLD_FOLDERS } from "../../config/cloudinary.js";

export async function createTaskController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { batchId } = req.params as { batchId: string };

  let fields: Record<string, any>;
  let attachmentFiles: import("../../utils/parse-multipart.js").ParsedFile[] = [];

  try {
    const parsed = await parseMultipart(req, {
      allowedFileFields: {
        attachment: { folder: CLD_FOLDERS.TASK_ATTACHMENTS, maxCount: 3, required: false },
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

  const input = createTaskSchema.parse(fields);
  const attachmentUploads = attachmentFiles.map((f) => ({
    buffer: f.buffer,
    mimetype: f.mimetype,
    originalFilename: f.filename,
    folder: CLD_FOLDERS.TASK_ATTACHMENTS,
    size: f.size,
  }));

  const data = await createTask(teacherId, batchId, input, attachmentUploads);
  return reply.status(201).send({ success: true, message: "Task created", data });
}

export async function getTaskByIdController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const data = await getTaskById(id);
  return reply.send({ success: true, data });
}

export async function getTaskListController(req: FastifyRequest, reply: FastifyReply) {
  const query = taskQuerySchema.parse(req.query);
  const data = await getTaskList(query);
  return reply.send({ success: true, ...data });
}

export async function getMyTasksController(req: FastifyRequest, reply: FastifyReply) {
  const studentId = req.user!.userId;
  const { batch_id } = req.query as { batch_id?: string };
  const data = await getStudentTasks(studentId, batch_id);
  return reply.send({ success: true, data });
}

export async function updateTaskController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { id } = req.params as { id: string };

  let fields: Record<string, any>;
  let attachmentFiles: import("../../utils/parse-multipart.js").ParsedFile[] = [];

  try {
    const parsed = await parseMultipart(req, {
      allowedFileFields: {
        attachment: { folder: CLD_FOLDERS.TASK_ATTACHMENTS, maxCount: 3, required: false },
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

  const input = updateTaskSchema.parse(fields);
  const attachmentUploads = attachmentFiles.map((f) => ({
    buffer: f.buffer,
    mimetype: f.mimetype,
    originalFilename: f.filename,
    folder: CLD_FOLDERS.TASK_ATTACHMENTS,
    size: f.size,
  }));

  const data = await updateTask(teacherId, id, input, attachmentUploads);
  return reply.send({ success: true, message: "Task updated", data });
}

export async function deleteTaskController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { id } = req.params as { id: string };
  await deleteTask(teacherId, id);
  return reply.send({ success: true, message: "Task deleted" });
}
