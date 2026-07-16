import { prisma } from "../../config/prisma.js";
import { NotificationQueryInput } from "./notification.schema.js";

// ── Helpers ────────────────────────────────────────────────

export async function createNotification(data: {
  user_id: string;
  type: string;
  title: string;
  body: string;
  reference_type?: string;
  reference_id?: string;
  channel?: "IN_APP" | "EMAIL";
}) {
  return prisma.notification.create({
    data: {
      user_id: data.user_id,
      type: data.type as any,
      title: data.title,
      body: data.body,
      reference_type: data.reference_type,
      reference_id: data.reference_id,
      channel: (data.channel as any) || "IN_APP",
    },
  });
}

export async function getNotifications(userId: string, query: NotificationQueryInput) {
  const { page, limit, is_read, type } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    user_id: userId,
    ...(is_read !== undefined && { is_read }),
    ...(type && { type }),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        type: true,
        channel: true,
        title: true,
        body: true,
        reference_type: true,
        reference_id: true,
        is_read: true,
        read_at: true,
        created_at: true,
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { user_id: userId, is_read: false } }),
  ]);

  return {
    data: notifications,
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
    unread_count: unreadCount,
  };
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) throw new Error("NOT_FOUND");
  if (notification.user_id !== userId) throw new Error("FORBIDDEN");

  return prisma.notification.update({
    where: { id: notificationId },
    data: { is_read: true, read_at: new Date() },
  });
}

export async function markAllAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true, read_at: new Date() },
  });

  return { updated: result.count };
}

export async function deleteNotification(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) throw new Error("NOT_FOUND");
  if (notification.user_id !== userId) throw new Error("FORBIDDEN");

  await prisma.notification.delete({ where: { id: notificationId } });
}
