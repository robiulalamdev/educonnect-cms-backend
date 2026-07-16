import { FastifyRequest, FastifyReply } from "fastify";
import {
  getPackagesSchema,
  createPackageSchema,
  updatePackageSchema,
  packageFeatureSchema,
  grantSubscriptionSchema,
  subscribeSchema,
} from "./subscription.schema.js";
import {
  getPackages,
  getPackageById,
  getUserSubscription,
  getSubscriptionHistory,
  subscribeUser,
  createPackage,
  updatePackage,
  archivePackage,
  addPackageFeature,
  deletePackageFeature,
  grantSubscription,
  revokeSubscription,
} from "./subscription.service.js";

export async function getPackagesController(req: FastifyRequest, reply: FastifyReply) {
  const query = getPackagesSchema.parse(req.query);
  const data = await getPackages(query);
  return reply.send({ success: true, data });
}

export async function getPackageByIdController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const data = await getPackageById(id);
  return reply.send({ success: true, data });
}

export async function getMySubscriptionController(req: FastifyRequest, reply: FastifyReply) {
  const data = await getUserSubscription(req.user!.userId);
  return reply.send({ success: true, data });
}

export async function getMySubscriptionHistoryController(req: FastifyRequest, reply: FastifyReply) {
  const data = await getSubscriptionHistory(req.user!.userId);
  return reply.send({ success: true, data });
}

export async function subscribeController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const input = subscribeSchema.parse(req.body);
  const data = await subscribeUser(userId, input);
  return reply.send({ success: true, message: "Subscription activated", data });
}

// ── Admin Controllers ──────────────────────────────────────

export async function createPackageController(req: FastifyRequest, reply: FastifyReply) {
  const input = createPackageSchema.parse(req.body);
  const data = await createPackage(input);
  return reply.status(201).send({ success: true, message: "Package created", data });
}

export async function updatePackageController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const input = updatePackageSchema.parse(req.body);
  const data = await updatePackage(id, input);
  return reply.send({ success: true, message: "Package updated", data });
}

export async function archivePackageController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const data = await archivePackage(id);
  return reply.send({ success: true, message: "Package archived", data });
}

export async function addPackageFeatureController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const input = packageFeatureSchema.parse(req.body);
  const data = await addPackageFeature(id, input);
  return reply.status(201).send({ success: true, message: "Feature added", data });
}

export async function deletePackageFeatureController(req: FastifyRequest, reply: FastifyReply) {
  const { id, featureId } = req.params as { id: string; featureId: string };
  await deletePackageFeature(id, featureId);
  return reply.send({ success: true, message: "Feature removed" });
}

export async function grantSubscriptionController(req: FastifyRequest, reply: FastifyReply) {
  const adminId = req.admin!.adminId;
  const input = grantSubscriptionSchema.parse(req.body);
  const data = await grantSubscription(adminId, input);
  return reply.send({ success: true, message: "Subscription granted", data });
}

export async function revokeSubscriptionController(req: FastifyRequest, reply: FastifyReply) {
  const { userId } = req.params as { userId: string };
  await revokeSubscription(userId);
  return reply.send({ success: true, message: "Subscription revoked" });
}
