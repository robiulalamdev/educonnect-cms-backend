import { prisma } from "../../config/prisma.js";
import { NotificationQueryInput } from "./notification.schema.js";
import { notificationService } from "../shared/notification.service.js";
import { emailService } from "../shared/email.service.js";

// ── Preference-aware notification helper ──────────────────
// Checks user preferences before sending email/push.
// In-app notifications are always created (frontend handles display toggles).

export type NotifyUserInput = {
  user_id: string;
  type: string;
  title: string;
  body: string;
  reference_type?: string;
  reference_id?: string;
  /** Category for preference check: enrollment, payment, announcement, task, attendance, message, social */
  category?: string;
  /** Email sender — if provided, sends email if preference allows */
  email?: { send: (to: string) => Promise<any> };
  email_to?: string;
  /** Push data — if provided, sends push if preference allows */
  push_data?: Record<string, string>;
};

/**
 * Create in-app notification + optionally send email + push.
 * All channels are checked against user preferences.
 * Never throws — all failures are logged and swallowed.
 */
export async function notifyUser(input: NotifyUserInput) {
  const { user_id, type, title, body, reference_type, reference_id, category, email, email_to, push_data } = input;

  // 1. Always create in-app notification
  createNotification({
    user_id,
    type,
    title,
    body,
    reference_type,
    reference_id,
  }).catch((err) => console.error(`[Notification] In-app failed for ${user_id}:`, err.message));

  // 2. Check preferences for email and push
  if (category && (email || push_data)) {
    try {
      const prefs = await prisma.notificationPreference.findUnique({
        where: { user_id },
      }).catch(() => null);

      // Default to all enabled if no preferences set
      const emailEnabled = prefs ? prefs.email_enabled : true;
      const pushEnabled = prefs ? prefs.push_enabled : true;

      // Category-level check
      const categoryEnabled = prefs ? getCategoryPref(prefs, category) : true;

      // 3. Send email if enabled
      if (email && email_to && emailEnabled && categoryEnabled) {
        email.send(email_to).catch((err) =>
          console.error(`[Notification] Email failed for ${user_id}:`, err.message)
        );
      }

      // 4. Send push if enabled
      if (push_data && pushEnabled && categoryEnabled) {
        notificationService.sendToUser(user_id, title, body, push_data).catch((err) =>
          console.error(`[Notification] Push failed for ${user_id}:`, err.message)
        );
      }
    } catch {
      // Preference check failed — still created in-app, just skip email/push
    }
  } else if (push_data) {
    // No category — send push without preference check
    notificationService.sendToUser(user_id, title, body, push_data).catch(() => {});
  }
}

function getCategoryPref(prefs: any, category: string): boolean {
  const map: Record<string, boolean> = {
    enrollment: prefs.enrollment_notifications,
    payment: prefs.payment_notifications,
    announcement: prefs.announcement_notifications,
    task: prefs.task_notifications,
    attendance: prefs.attendance_notifications,
    message: prefs.message_notifications,
    social: prefs.social_notifications,
  };
  return map[category] !== false;
}

// ── Basic in-app notification (no email/push) ─────────────
// Checks user preferences before creating.
// If preferences say in-app is disabled, skips creation.
// If no preferences exist, creates (defaults to enabled).

export async function createNotification(data: {
  user_id: string;
  type: string;
  title: string;
  body: string;
  reference_type?: string;
  reference_id?: string;
  channel?: "IN_APP" | "EMAIL";
  /** Category for preference check — if provided, checks user prefs */
  category?: string;
}) {
  // Check preferences if category provided
  if (data.category) {
    try {
      const prefs = await prisma.notificationPreference.findUnique({
        where: { user_id: data.user_id },
      });
      if (prefs && !prefs.in_app_enabled) return null;
      if (prefs && getCategoryPref(prefs, data.category) === false) return null;
    } catch {
      // Preference check failed — create anyway (fail-open)
    }
  }

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

// ── CRUD ─────────────────────────────────────────────────

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
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    unread_count: unreadCount,
  };
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
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
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw new Error("NOT_FOUND");
  if (notification.user_id !== userId) throw new Error("FORBIDDEN");

  await prisma.notification.delete({ where: { id: notificationId } });
}
