import { prisma } from "../../config/prisma.js";

/**
 * Register or update a device token.
 * Works for both web (browser push) and mobile (Android/iOS) FCM tokens.
 * If token already exists, updates last_used_at and reactivates.
 */
export async function registerDevice(userId: string, fcmToken: string, platform: string, deviceInfo?: string) {
  return prisma.userDevice.upsert({
    where: { fcm_token: fcmToken },
    create: {
      user_id: userId,
      fcm_token: fcmToken,
      platform,
      device_info: deviceInfo,
    },
    update: {
      is_active: true,
      device_info: deviceInfo,
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
      device_info: true,
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

export async function removeDeviceById(userId: string, deviceId: string) {
  const device = await prisma.userDevice.findUnique({ where: { id: deviceId } });
  if (!device || device.user_id !== userId) throw new Error("NOT_FOUND");
  await prisma.userDevice.delete({ where: { id: deviceId } });
}
