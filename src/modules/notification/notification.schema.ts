import { z } from "zod";
import { NOTIFICATION_TYPES } from "./notification.types.js";

export const notificationQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  is_read: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  type: z.nativeEnum(NOTIFICATION_TYPES.TYPE_OBJECT).optional(),
});

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
