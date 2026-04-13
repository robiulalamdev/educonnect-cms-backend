import { FastifyRequest, FastifyReply } from "fastify";
import { linkStudentSchema, respondToLinkSchema } from "./guardian.schema.js";
import {
  requestStudentLink,
  getLinksForGuardian,
  getLinksForStudent,
  respondToLinkRequest,
} from "./guardian.service.js";

/**
 * Handle request to link student
 */
export async function requestLinkController(req: FastifyRequest, reply: FastifyReply) {
  const body = linkStudentSchema.safeParse(req.body);
  if (!body.success) {
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });
  }

  try {
    const data = await requestStudentLink(req.user!.userId, body.data);
    return reply.send({
      success: true,
      message: "Link request sent to student",
      data,
    });
  } catch (err: any) {
    if (err.message === "STUDENT_NOT_FOUND") {
      return reply.status(404).send({ success: false, message: "Student not found with provided identifier" });
    }
    if (err.message === "CANNOT_LINK_SELF") {
      return reply.status(400).send({ success: false, message: "You cannot link to yourself" });
    }
    if (err.message === "ALREADY_LINKED") {
      return reply.status(409).send({ success: false, message: "You are already linked with this student" });
    }
    if (err.message === "LINK_PENDING") {
      return reply.status(409).send({ success: false, message: "A link request is already pending with this student" });
    }
    throw err;
  }
}

/**
 * Handle listing links for guardian
 */
export async function getGuardianLinksController(req: FastifyRequest, reply: FastifyReply) {
  const data = await getLinksForGuardian(req.user!.userId);
  return reply.send({ success: true, data });
}

/**
 * Handle listing link requests for student
 */
export async function getStudentLinksController(req: FastifyRequest, reply: FastifyReply) {
  const data = await getLinksForStudent(req.user!.userId);
  return reply.send({ success: true, data });
}

/**
 * Handle student's response to link request
 */
export async function respondToLinkController(req: FastifyRequest, reply: FastifyReply) {
  const body = respondToLinkSchema.safeParse(req.body);
  if (!body.success) {
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });
  }

  try {
    const data = await respondToLinkRequest(req.user!.userId, body.data);
    const actionLabel = body.data.action === "ACTIVE" ? "approved" : "rejected";
    return reply.send({
      success: true,
      message: `Link request ${actionLabel} successfully`,
      data,
    });
  } catch (err: any) {
    if (err.message === "LINK_NOT_FOUND") {
      return reply.status(404).send({ success: false, message: "Link request not found" });
    }
    if (err.message === "UNAUTHORIZED") {
      return reply.status(403).send({ success: false, message: "You are not authorized to respond to this link" });
    }
    if (err.message === "LINK_ALREADY_PROCESSED") {
      return reply.status(400).send({ success: false, message: "This link request has already been processed" });
    }
    throw err;
  }
}
