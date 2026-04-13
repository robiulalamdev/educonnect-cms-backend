import { FastifyRequest, FastifyReply } from "fastify";
import { educationQuerySchema, subjectQuerySchema, dropdownQuerySchema } from "./education.schema.js";
import {
  getLevelGroups,
  getLevels,
  getSubjectCategories,
  getSubjects,
  getLevelsDropdown,
  getSubjectsDropdown,
} from "./education.service.js";

/**
 * Handle fetching level groups
 */
export async function getLevelGroupsController(req: FastifyRequest, reply: FastifyReply) {
  const is_active = (req.query as any).is_active !== "false";
  const data = await getLevelGroups(is_active);
  return reply.send({ success: true, data });
}

/**
 * Handle fetching levels
 */
export async function getLevelsController(req: FastifyRequest, reply: FastifyReply) {
  const query = educationQuerySchema.safeParse(req.query);
  if (!query.success) {
    return reply.status(400).send({
      success: false,
      errors: query.error.flatten().fieldErrors,
    });
  }

  const data = await getLevels(query.data);
  return reply.send({ success: true, data });
}

/**
 * Optimized Dropdown: Levels
 */
export async function getLevelsDropdownController(req: FastifyRequest, reply: FastifyReply) {
  const query = dropdownQuerySchema.parse(req.query);
  const data = await getLevelsDropdown(query);
  return reply.send({ success: true, ...data });
}

/**
 * Handle fetching subject categories
 */
export async function getSubjectCategoriesController(req: FastifyRequest, reply: FastifyReply) {
  const is_active = (req.query as any).is_active !== "false";
  const data = await getSubjectCategories(is_active);
  return reply.send({ success: true, data });
}

/**
 * Handle fetching subjects
 */
export async function getSubjectsController(req: FastifyRequest, reply: FastifyReply) {
  const query = subjectQuerySchema.safeParse(req.query);
  if (!query.success) {
    return reply.status(400).send({
      success: false,
      errors: query.error.flatten().fieldErrors,
    });
  }

  const data = await getSubjects(query.data);
  return reply.send({ success: true, data });
}

/**
 * Optimized Dropdown: Subjects
 */
export async function getSubjectsDropdownController(req: FastifyRequest, reply: FastifyReply) {
  const query = dropdownQuerySchema.parse(req.query);
  const data = await getSubjectsDropdown(query);
  return reply.send({ success: true, ...data });
}
