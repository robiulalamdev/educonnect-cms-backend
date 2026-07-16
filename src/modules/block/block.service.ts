import { prisma } from "../../config/prisma.js";
import { BlockUserInput, BlockQueryInput } from "./block.schema.js";

export async function blockUser(blockerId: string, input: BlockUserInput) {
  const { blocked_id, reason } = input;

  if (blockerId === blocked_id) throw new Error("CANNOT_BLOCK_SELF");

  const userToBlock = await prisma.user.findUnique({ where: { id: blocked_id } });
  if (!userToBlock) throw new Error("USER_NOT_FOUND");

  const existing = await prisma.block.findUnique({
    where: { blocker_id_blocked_id: { blocker_id: blockerId, blocked_id } },
  });
  if (existing) throw new Error("ALREADY_BLOCKED");

  return prisma.block.create({
    data: { blocker_id: blockerId, blocked_id, reason },
    select: {
      id: true,
      blocked_id: true,
      reason: true,
      created_at: true,
      blocked: {
        select: { id: true, full_name: true, role: true },
      },
    },
  });
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const block = await prisma.block.findUnique({
    where: { blocker_id_blocked_id: { blocker_id: blockerId, blocked_id: blockedId } },
  });

  if (!block) throw new Error("NOT_FOUND");

  await prisma.block.delete({ where: { id: block.id } });
}

export async function getBlockedUsers(userId: string, query: BlockQueryInput) {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    blocker_id: userId,
    ...(search && {
      blocked: {
        full_name: { contains: search, mode: "insensitive" },
      },
    }),
  };

  const [blocks, total] = await Promise.all([
    prisma.block.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        reason: true,
        created_at: true,
        blocked: {
          select: { id: true, full_name: true, role: true },
        },
      },
    }),
    prisma.block.count({ where }),
  ]);

  return {
    data: blocks,
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}

export async function isBlocked(userId: string, targetId: string): Promise<boolean> {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blocker_id: userId, blocked_id: targetId },
        { blocker_id: targetId, blocked_id: userId },
      ],
    },
  });
  return !!block;
}
