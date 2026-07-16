import { prisma } from "../../config/prisma.js";

export type NotificationPreferenceInput = {
  in_app_enabled?: boolean;
  email_enabled?: boolean;
  push_enabled?: boolean;
  enrollment_notifications?: boolean;
  payment_notifications?: boolean;
  announcement_notifications?: boolean;
  task_notifications?: boolean;
  attendance_notifications?: boolean;
  message_notifications?: boolean;
  social_notifications?: boolean;
};

export async function getPreferences(userId: string) {
  let prefs = await prisma.notificationPreference.findUnique({
    where: { user_id: userId },
  });

  // Auto-create defaults if not exists
  if (!prefs) {
    prefs = await prisma.notificationPreference.create({
      data: { user_id: userId },
    });
  }

  return prefs;
}

export async function updatePreferences(userId: string, input: NotificationPreferenceInput) {
  return prisma.notificationPreference.upsert({
    where: { user_id: userId },
    create: { user_id: userId, ...input },
    update: input,
  });
}

/**
 * Check if a user wants to receive a specific notification type via a specific channel.
 */
export async function shouldNotify(userId: string, category: string, channel: "IN_APP" | "EMAIL" | "PUSH"): Promise<boolean> {
  const prefs = await getPreferences(userId);

  // Channel-level toggle
  if (channel === "IN_APP" && !prefs.in_app_enabled) return false;
  if (channel === "EMAIL" && !prefs.email_enabled) return false;
  if (channel === "PUSH" && !prefs.push_enabled) return false;

  // Category-level toggle
  const categoryMap: Record<string, boolean> = {
    enrollment: prefs.enrollment_notifications,
    payment: prefs.payment_notifications,
    announcement: prefs.announcement_notifications,
    task: prefs.task_notifications,
    attendance: prefs.attendance_notifications,
    message: prefs.message_notifications,
    social: prefs.social_notifications,
  };

  if (categoryMap[category] === false) return false;

  return true;
}
