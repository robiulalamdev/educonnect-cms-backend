import { FastifyRequest, FastifyReply } from "fastify";
import {
  userListQuerySchema,
  updateTeacherProfileSchema,
  updateStudentProfileSchema,
  updateGuardianProfileSchema,
} from "./user.schema.js";
import {
  getUsers,
  getUserById,
  updateTeacherProfile,
  updateStudentProfile,
  updateGuardianProfile,
} from "./user.service.js";

/**
 * Handle listing/searching users
 */
export async function getUsersController(req: FastifyRequest, reply: FastifyReply) {
  const query = userListQuerySchema.safeParse(req.query);
  if (!query.success) {
    return reply.status(400).send({
      success: false,
      errors: query.error.flatten().fieldErrors,
    });
  }

  const result = await getUsers(query.data);
  return reply.send({ success: true, ...result });
}

/**
 * Handle getting a user by ID
 */
export async function getUserByIdController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };

  try {
    const user = await getUserById(id);
    return reply.send({ success: true, data: user });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      return reply.status(404).send({ success: false, message: "User not found" });
    }
    throw err;
  }
}

/**
 * Handle Teacher profile update
 */
export async function updateTeacherProfileController(req: FastifyRequest, reply: FastifyReply) {
  const body = updateTeacherProfileSchema.safeParse(req.body);
  if (!body.success) {
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });
  }

  try {
    const profile = await updateTeacherProfile(req.user!.userId, body.data);
    return reply.send({ success: true, message: "Teacher profile updated", data: profile });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      return reply.status(404).send({ success: false, message: "User not found" });
    }
    if (err.message === "INVALID_ROLE") {
      return reply.status(403).send({ success: false, message: "Access denied: Not a teacher" });
    }
    throw err;
  }
}

/**
 * Handle Student profile update
 */
export async function updateStudentProfileController(req: FastifyRequest, reply: FastifyReply) {
  const body = updateStudentProfileSchema.safeParse(req.body);
  if (!body.success) {
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });
  }

  try {
    const profile = await updateStudentProfile(req.user!.userId, body.data);
    return reply.send({ success: true, message: "Student profile updated", data: profile });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      return reply.status(404).send({ success: false, message: "User not found" });
    }
    if (err.message === "INVALID_ROLE") {
      return reply.status(403).send({ success: false, message: "Access denied: Not a student" });
    }
    throw err;
  }
}

/**
 * Handle Guardian profile update
 */
export async function updateGuardianProfileController(req: FastifyRequest, reply: FastifyReply) {
  const body = updateGuardianProfileSchema.safeParse(req.body);
  if (!body.success) {
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });
  }

  try {
    const profile = await updateGuardianProfile(req.user!.userId, body.data);
    return reply.send({ success: true, message: "Guardian profile updated", data: profile });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      return reply.status(404).send({ success: false, message: "User not found" });
    }
    if (err.message === "INVALID_ROLE") {
      return reply.status(403).send({ success: false, message: "Access denied: Not a guardian" });
    }
    throw err;
  }
}
