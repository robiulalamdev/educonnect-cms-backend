import { FastifyRequest, FastifyReply } from "fastify";
import { updateStudentProfileSchema } from "./student.schema.js";
import { updateStudentProfile, getStudentDetails } from "./student.service.js";

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
 * Handle getting student own details
 */
export async function getStudentMeController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await getStudentDetails(req.user!.userId);
    return reply.send({ success: true, data });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      return reply.status(404).send({ success: false, message: "Student not found" });
    }
    throw err;
  }
}
