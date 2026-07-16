import { FastifyRequest, FastifyReply } from "fastify";
import { followUserSchema, followQuerySchema } from "./follow.schema.js";
import { followUser, unfollowUser, getFollowers, getFollowing, isFollowing } from "./follow.service.js";
import { notifyUser } from "../notification/notification.service.js";
import { prisma } from "../../config/prisma.js";
import { socketManager } from "../../config/socket.js";

export async function followUserController(req: FastifyRequest, reply: FastifyReply) {
  const followerId = req.user!.userId;
  const input = followUserSchema.parse(req.body);
  const data = await followUser(followerId, input);
  
  // Notify the followed user
  const follower = await prisma.user.findUnique({ where: { id: followerId }, select: { full_name: true } });
  notifyUser({
    user_id: input.following_id,
    type: "NEW_FOLLOWER",
    title: "New follower",
    body: `${follower?.full_name || "Someone"} started following you`,
    reference_type: "user",
    reference_id: followerId,
    category: "social",
  });
  socketManager.emitToRoom(`user_${input.following_id}`, "new_notification", {
    type: "NEW_FOLLOWER",
    title: "New follower",
    body: `${follower?.full_name || "Someone"} started following you`,
  });
  
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
