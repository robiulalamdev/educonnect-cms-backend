import { FastifyRequest, FastifyReply } from "fastify";
import { followUserSchema, followQuerySchema } from "./follow.schema.js";
import { followUser, unfollowUser, getFollowers, getFollowing, isFollowing } from "./follow.service.js";

export async function followUserController(req: FastifyRequest, reply: FastifyReply) {
  const followerId = req.user!.userId;
  const input = followUserSchema.parse(req.body);
  const data = await followUser(followerId, input);
  return reply.status(201).send({ success: true, message: "Now following", data });
}

export async function unfollowUserController(req: FastifyRequest, reply: FastifyReply) {
  const followerId = req.user!.userId;
  const { id } = req.params as { id: string };
  await unfollowUser(followerId, id);
  return reply.send({ success: true, message: "Unfollowed" });
}

export async function getFollowersController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const query = followQuerySchema.parse(req.query);
  const data = await getFollowers(id, query);
  return reply.send({ success: true, ...data });
}

export async function getFollowingController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const query = followQuerySchema.parse(req.query);
  const data = await getFollowing(id, query);
  return reply.send({ success: true, ...data });
}

export async function checkFollowStatusController(req: FastifyRequest, reply: FastifyReply) {
  const followerId = req.user!.userId;
  const { id } = req.params as { id: string };
  const following = await isFollowing(followerId, id);
  return reply.send({ success: true, data: { is_following: following } });
}
