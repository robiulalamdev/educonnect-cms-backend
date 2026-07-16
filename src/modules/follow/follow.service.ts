import { prisma } from "../../config/prisma.js";
import { FollowUserInput, FollowQueryInput } from "./follow.schema.js";
import { createNotification } from "../notification/notification.service.js";

export async function followUser(followerId: string, input: FollowUserInput) {
  const { following_id } = input;

  if (followerId === following_id) throw new Error("CANNOT_FOLLOW_SELF");

  const userToFollow = await prisma.user.findUnique({ where: { id: following_id } });
  if (!userToFollow) throw new Error("USER_NOT_FOUND");

  const existing = await prisma.follow.findUnique({
    where: { follower_id_following_id: { follower_id: followerId, following_id } },
  });
  if (existing) throw new Error("ALREADY_FOLLOWING");

  const follow = await prisma.follow.create({
    data: { follower_id: followerId, following_id },
    select: {
      id: true,
      created_at: true,
      following: {
        select: { id: true, full_name: true, role: true },
      },
    },
  });

  // Notify the followed user
  createNotification({
    user_id: following_id,
    type: "FOLLOW_NEW",
    title: "New Follower",
    body: "Someone started following you",
    reference_type: "follow",
    reference_id: follow.id,
    category: "social",
  }).catch(console.error);

  return follow;
}

export async function unfollowUser(followerId: string, followingId: string) {
  const follow = await prisma.follow.findUnique({
    where: { follower_id_following_id: { follower_id: followerId, following_id: followingId } },
  });

  if (!follow) throw new Error("NOT_FOUND");

  await prisma.follow.delete({ where: { id: follow.id } });
}

export async function getFollowers(userId: string, query: FollowQueryInput) {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    following_id: userId,
    ...(search && {
      follower: {
        full_name: { contains: search, mode: "insensitive" },
      },
    }),
  };

  const [followers, total] = await Promise.all([
    prisma.follow.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        created_at: true,
        follower: {
          select: { id: true, full_name: true, role: true, avatar: { select: { key: true } } },
        },
      },
    }),
    prisma.follow.count({ where }),
  ]);

  return {
    data: followers,
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}

export async function getFollowing(userId: string, query: FollowQueryInput) {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    follower_id: userId,
    ...(search && {
      following: {
        full_name: { contains: search, mode: "insensitive" },
      },
    }),
  };

  const [following, total] = await Promise.all([
    prisma.follow.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        created_at: true,
        following: {
          select: { id: true, full_name: true, role: true, avatar: { select: { key: true } } },
        },
      },
    }),
    prisma.follow.count({ where }),
  ]);

  return {
    data: following,
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const follow = await prisma.follow.findUnique({
    where: { follower_id_following_id: { follower_id: followerId, following_id: followingId } },
  });
  return !!follow;
}
