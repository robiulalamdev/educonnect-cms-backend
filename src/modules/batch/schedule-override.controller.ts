import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
  createScheduleOverride,
  getScheduleOverrides,
  updateScheduleOverride,
  deleteScheduleOverride,
} from "./schedule-override.service.js";

const createOverrideSchema = z.object({
  override_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["CANCELLED", "EXTRA", "HOLIDAY", "RESCHEDULED"]),
  reason: z.string().max(500).optional(),
  new_start: z.string().optional(),
  new_end: z.string().optional(),
});

const updateOverrideSchema = z.object({
  type: z.enum(["CANCELLED", "EXTRA", "HOLIDAY", "RESCHEDULED"]).optional(),
  reason: z.string().max(500).optional(),
  new_start: z.string().optional(),
  new_end: z.string().optional(),
});

export async function createScheduleOverrideController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { batchId } = req.params as { batchId: string };
  const input = createOverrideSchema.parse(req.body);
  const data = await createScheduleOverride(teacherId, batchId, input);
  return reply.status(201).send({ success: true, message: "Schedule override created", data });
}

export async function getScheduleOverridesController(req: FastifyRequest, reply: FastifyReply) {
  const { batchId } = req.params as { batchId: string };
  const data = await getScheduleOverrides(batchId);
  return reply.send({ success: true, data });
}

export async function updateScheduleOverrideController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { id } = req.params as { id: string };
  const input = updateOverrideSchema.parse(req.body);
  const data = await updateScheduleOverride(teacherId, id, input);
  return reply.send({ success: true, message: "Override updated", data });
}

export async function deleteScheduleOverrideController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { id } = req.params as { id: string };
  await deleteScheduleOverride(teacherId, id);
  return reply.send({ success: true, message: "Override deleted" });
}
