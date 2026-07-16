import { FastifyRequest, FastifyReply } from "fastify";
import { blockUserSchema, blockQuerySchema } from "./block.schema.js";
import { blockUser, unblockUser, getBlockedUsers } from "./block.service.js";

export async function blockUserController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const input = blockUserSchema.parse(req.body);
  const data = await blockUser(userId, input);
  return reply.status(201).send({ success: true, message: "User blocked", data });
}

export async function unblockUserController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };
  await unblockUser(userId, id);
  return reply.send({ success: true, message: "User unblocked" });
}

export async function getBlockedUsersController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const query = blockQuerySchema.parse(req.query);
  const data = await getBlockedUsers(userId, query);
  return reply.send({ success: true, ...data });
}
