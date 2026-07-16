import { FastifyRequest, FastifyReply } from "fastify";
import {
  updateGuardianProfileSchema,
  sendLinkRequestSchema,
  respondLinkRequestSchema,
} from "./guardian.schema.js";
import {
  updateGuardianProfile,
  getGuardianDetails,
  sendLinkRequest,
  respondToLinkRequest,
  getMyLinks,
  removeLink,
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
