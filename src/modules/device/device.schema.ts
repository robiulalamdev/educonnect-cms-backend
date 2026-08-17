import { z } from "zod";

export const registerDeviceSchema = z.object({
  fcm_token: z.string().min(1),
  platform: z.enum(["web", "android", "ios"]),
  device_info: z.string().max(200).optional(),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
