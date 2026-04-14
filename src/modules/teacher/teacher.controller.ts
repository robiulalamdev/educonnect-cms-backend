import { FastifyRequest, FastifyReply } from "fastify";
import { updateTeacherProfileSchema } from "./teacher.schema.js";
import { updateTeacherProfile, getTeacherDetails } from "./teacher.service.js";

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
 * Handle getting teacher details
 */
export async function getTeacherDetailsController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  try {
    const data = await getTeacherDetails(id);
    return reply.send({ success: true, data });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      return reply.status(404).send({ success: false, message: "Teacher not found" });
    }
    throw err;
  }
}
