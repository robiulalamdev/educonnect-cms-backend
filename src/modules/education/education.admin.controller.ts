import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
  createLevelGroup,
  updateLevelGroup,
  deleteLevelGroup,
  createLevel,
  updateLevel,
  deleteLevel,
  createSubjectCategory,
  updateSubjectCategory,
  deleteSubjectCategory,
  createSubject,
  updateSubject,
  deleteSubject,
} from "./education.admin.service.js";

const createLevelGroupSchema = z.object({ name: z.string().min(1).max(100), sort_order: z.number().int().optional() });
const updateLevelGroupSchema = z.object({ name: z.string().min(1).max(100).optional(), sort_order: z.number().int().optional(), is_active: z.boolean().optional() });
const createLevelSchema = z.object({ group_id: z.string().min(1), name: z.string().min(1).max(100), sort_order: z.number().int().optional() });
const updateLevelSchema = z.object({ name: z.string().min(1).max(100).optional(), sort_order: z.number().int().optional(), is_active: z.boolean().optional() });
const createCategorySchema = z.object({ name: z.string().min(1).max(100) });
const updateCategorySchema = z.object({ name: z.string().min(1).max(100).optional(), is_active: z.boolean().optional() });
const createSubjectSchema = z.object({ category_id: z.string().min(1), name: z.string().min(1).max(100) });
const updateSubjectSchema = z.object({ name: z.string().min(1).max(100).optional(), is_active: z.boolean().optional() });

// ── Level Groups ───────────────────────────────────────────

export async function createLevelGroupController(req: FastifyRequest, reply: FastifyReply) {
  const body = createLevelGroupSchema.parse(req.body);
  const data = await createLevelGroup(body);
  return reply.status(201).send({ success: true, data });
}

export async function updateLevelGroupController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const body = updateLevelGroupSchema.parse(req.body);
  const data = await updateLevelGroup(id, body);
  return reply.send({ success: true, data });
}

export async function deleteLevelGroupController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  await deleteLevelGroup(id);
  return reply.send({ success: true, message: "Level group deleted" });
}

// ── Levels ─────────────────────────────────────────────────

export async function createLevelController(req: FastifyRequest, reply: FastifyReply) {
  const body = createLevelSchema.parse(req.body);
  const data = await createLevel(body);
  return reply.status(201).send({ success: true, data });
}

export async function updateLevelController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const body = updateLevelSchema.parse(req.body);
  const data = await updateLevel(id, body);
  return reply.send({ success: true, data });
}

export async function deleteLevelController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  await deleteLevel(id);
  return reply.send({ success: true, message: "Level deleted" });
}

// ── Subject Categories ─────────────────────────────────────

export async function createSubjectCategoryController(req: FastifyRequest, reply: FastifyReply) {
  const body = createCategorySchema.parse(req.body);
  const data = await createSubjectCategory(body);
  return reply.status(201).send({ success: true, data });
}

export async function updateSubjectCategoryController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const body = updateCategorySchema.parse(req.body);
  const data = await updateSubjectCategory(id, body);
  return reply.send({ success: true, data });
}

export async function deleteSubjectCategoryController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  await deleteSubjectCategory(id);
  return reply.send({ success: true, message: "Category deleted" });
}

// ── Subjects ───────────────────────────────────────────────

export async function createSubjectController(req: FastifyRequest, reply: FastifyReply) {
  const body = createSubjectSchema.parse(req.body);
  const data = await createSubject(body);
  return reply.status(201).send({ success: true, data });
}

export async function updateSubjectController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const body = updateSubjectSchema.parse(req.body);
  const data = await updateSubject(id, body);
  return reply.send({ success: true, data });
}

export async function deleteSubjectController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  await deleteSubject(id);
  return reply.send({ success: true, message: "Subject deleted" });
}
