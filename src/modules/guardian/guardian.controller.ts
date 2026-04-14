import { FastifyRequest, FastifyReply } from "fastify";
import { updateGuardianProfileSchema } from "./guardian.schema.js";
import { updateGuardianProfile, getGuardianDetails } from "./guardian.service.js";

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

/**
 * Handle getting guardian own details
 */
export async function getGuardianMeController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await getGuardianDetails(req.user!.userId);
    return reply.send({ success: true, data });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      return reply.status(404).send({ success: false, message: "Guardian not found" });
    }
    throw err;
  }
}
