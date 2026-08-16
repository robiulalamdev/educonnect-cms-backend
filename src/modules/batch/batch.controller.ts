import { FastifyRequest, FastifyReply } from "fastify";
import { 
  createBatchSchema, 
  updateBatchSchema, 
  batchQuerySchema 
} from "./batch.schema.js";
import { 
  createBatch, 
  getBatchList, 
  getBatchById, 
  updateBatch, 
  getBatchesDropdown,
  getCalendarEvents,
} from "./batch.service.js";
import { dropdownQuerySchema } from "../education/education.schema.js";
import { BATCH_TYPES } from "./batch.types.js";

export async function createBatchController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const input = createBatchSchema.parse(req.body);
  const data = await createBatch(teacherId, input);
  return reply.send({ success: true, message: "Batch created successfully", data });
}

export async function getBatchListController(req: FastifyRequest, reply: FastifyReply) {
  const query = batchQuerySchema.parse(req.query);
  const data = await getBatchList({ ...query, status: BATCH_TYPES.STATUS_OBJECT.ONGOING });
  return reply.send({ success: true, ...data });
}

export async function getTeacherBatchesController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const query = batchQuerySchema.parse(req.query);
  const data = await getBatchList({ ...query, teacher_id: teacherId });
  return reply.send({ success: true, ...data });
}

export async function getAdminBatchesController(req: FastifyRequest, reply: FastifyReply) {
  const query = batchQuerySchema.parse(req.query);
  const data = await getBatchList(query);
  return reply.send({ success: true, ...data });
}

export async function getBatchByIdController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const data = await getBatchById(id);
  return reply.send({ success: true, data });
}

export async function updateBatchController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { id } = req.params as { id: string };
  const input = updateBatchSchema.parse(req.body);
  const data = await updateBatch(id, teacherId, input);
  return reply.send({ success: true, message: "Batch updated successfully", data });
}

/**
 * Handle optimized dropdowns with context
 */
export async function getBatchesDropdownController(req: FastifyRequest, reply: FastifyReply) {
  const query = dropdownQuerySchema.parse(req.query);
  const { service_id } = req.query as { service_id?: string };
  
  const context = {
    teacher_id: req.user?.role === "TEACHER" ? req.user.userId : undefined,
    service_id
  };

  const data = await getBatchesDropdown(query, context);
  return reply.send({ success: true, ...data });
}

export async function getCalendarEventsController(req: FastifyRequest, reply: FastifyReply) {
  const { start, end } = req.query as { start?: string; end?: string };
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  const startDate = start || new Date().toISOString();
  const endDate = end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const data = await getCalendarEvents(userId, userRole, startDate, endDate);
  return reply.send({ success: true, data });
}
