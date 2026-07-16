import { prisma } from "../../config/prisma.js";

export async function registerDevice(userId: string, fcmToken: string, platform: string) {
  return prisma.userDevice.upsert({
    where: { fcm_token: fcmToken },
    create: {
      user_id: userId,
      fcm_token: fcmToken,
      platform,
    },
    update: {
      is_active: true,
      last_used_at: new Date(),
    },
  });
}

export async function removeDevice(userId: string, fcmToken: string) {
  const device = await prisma.userDevice.findUnique({
    where: { fcm_token: fcmToken },
  });

  if (!device || device.user_id !== userId) throw new Error("NOT_FOUND");

  await prisma.userDevice.delete({ where: { fcm_token: fcmToken } });
}

export async function getDevices(userId: string) {
  return prisma.userDevice.findMany({
    where: { user_id: userId },
    orderBy: { last_used_at: "desc" },
    select: {
      id: true,
      fcm_token: true,
      platform: true,
      is_active: true,
      last_used_at: true,
      created_at: true,
    },
  });
}

export async function deactivateAllDevices(userId: string) {
  return prisma.userDevice.updateMany({
    where: { user_id: userId },
    data: { is_active: false },
  });
}
