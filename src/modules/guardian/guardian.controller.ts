import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
  updateGuardianProfileSchema,
  sendLinkRequestSchema,
  respondLinkRequestSchema,
  adminDirectLinkSchema,
} from "./guardian.schema.js";
import {
  updateGuardianProfile,
  getGuardianDetails,
  sendLinkRequest,
  respondToLinkRequest,
  getMyLinks,
  removeLink,
  adminDirectLink,
  adminGetAllLinks,
  adminRemoveLink,
} from "./guardian.service.js";

export async function updateGuardianProfileController(req: FastifyRequest, reply: FastifyReply) {
  const body = updateGuardianProfileSchema.safeParse(req.body);
  if (!body.success) {
    return reply.status(400).send({ success: false, errors: body.error.flatten().fieldErrors });
  }

  try {
    const profile = await updateGuardianProfile(req.user!.userId, body.data);
    return reply.send({ success: true, message: "Guardian profile updated", data: profile });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return reply.status(404).send({ success: false, message: "User not found" });
    if (err.message === "INVALID_ROLE") return reply.status(403).send({ success: false, message: "Access denied: Not a guardian" });
    throw err;
  }
}

export async function getGuardianMeController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await getGuardianDetails(req.user!.userId);
    return reply.send({ success: true, data });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return reply.status(404).send({ success: false, message: "Guardian not found" });
    throw err;
  }
}

// ── Link Request Controllers ───────────────────────────────

export async function sendLinkRequestController(req: FastifyRequest, reply: FastifyReply) {
  const input = sendLinkRequestSchema.parse(req.body);
  const data = await sendLinkRequest(req.user!.userId, input);
  return reply.status(201).send({ success: true, message: "Link request sent", data });
}

export async function respondToLinkRequestController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const input = respondLinkRequestSchema.parse(req.body);
  const data = await respondToLinkRequest(req.user!.userId, id, input);
  return reply.send({ success: true, message: `Link request ${input.action.toLowerCase()}`, data });
}

export async function getMyLinksController(req: FastifyRequest, reply: FastifyReply) {
  const data = await getMyLinks(req.user!.userId);
  return reply.send({ success: true, data });
}

export async function removeLinkController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  await removeLink(req.user!.userId, id);
  return reply.send({ success: true, message: "Link removed" });
}

// ── Admin Controllers ─────────────────────────────────────

const adminLinkQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "PENDING", "REMOVED"]).optional(),
});

export async function adminDirectLinkController(req: FastifyRequest, reply: FastifyReply) {
  const body = adminDirectLinkSchema.safeParse(req.body);
  if (!body.success) {
    return reply.status(400).send({ success: false, errors: body.error.flatten().fieldErrors });
  }

  try {
    const link = await adminDirectLink(body.data.guardian_user_id, body.data.student_user_id, body.data.relation_label);
    return reply.status(201).send({ success: true, message: "Guardian linked to student", data: link });
  } catch (err: any) {
    if (err.message === "GUARDIAN_NOT_FOUND") return reply.status(404).send({ success: false, message: "Guardian not found" });
    if (err.message === "USER_NOT_GUARDIAN") return reply.status(400).send({ success: false, message: "User is not a guardian" });
    if (err.message === "GUARDIAN_PROFILE_NOT_FOUND") return reply.status(404).send({ success: false, message: "Guardian profile not found" });
    if (err.message === "STUDENT_NOT_FOUND") return reply.status(404).send({ success: false, message: "Student not found" });
    if (err.message === "USER_NOT_STUDENT") return reply.status(400).send({ success: false, message: "User is not a student" });
    if (err.message === "STUDENT_NO_PROFILE") return reply.status(400).send({ success: false, message: "Student has no profile" });
    if (err.message === "ALREADY_LINKED") return reply.status(409).send({ success: false, message: "Guardian is already linked to this student" });
    throw err;
  }
}

export async function adminGetAllLinksController(req: FastifyRequest, reply: FastifyReply) {
  const query = adminLinkQuerySchema.safeParse(req.query);
  if (!query.success) {
    return reply.status(400).send({ success: false, errors: query.error.flatten().fieldErrors });
  }
  const data = await adminGetAllLinks(query.data);
  return reply.send({ success: true, ...data });
}

export async function adminRemoveLinkController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  try {
    await adminRemoveLink(id);
    return reply.send({ success: true, message: "Link removed" });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return reply.status(404).send({ success: false, message: "Link not found" });
    throw err;
  }
}
