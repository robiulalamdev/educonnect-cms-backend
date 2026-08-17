import { z } from "zod";

export const updatePreferencesSchema = z.object({
  in_app_enabled: z.boolean().optional(),
  email_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  enrollment_notifications: z.boolean().optional(),
  payment_notifications: z.boolean().optional(),
  announcement_notifications: z.boolean().optional(),
  task_notifications: z.boolean().optional(),
  attendance_notifications: z.boolean().optional(),
  message_notifications: z.boolean().optional(),
  social_notifications: z.boolean().optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
