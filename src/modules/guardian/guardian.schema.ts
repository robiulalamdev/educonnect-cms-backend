import { z } from "zod";

export const updateGuardianProfileSchema = z.object({
  occupation: z.string().optional(),
});

export const sendLinkRequestSchema = z.object({
  target_user_id: z.string().min(1),
  relation_label: z.string().max(50).optional(),
});

export const respondLinkRequestSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT"]),
});

export type UpdateGuardianProfileInput = z.infer<typeof updateGuardianProfileSchema>;
export type SendLinkRequestInput = z.infer<typeof sendLinkRequestSchema>;
export type RespondLinkRequestInput = z.infer<typeof respondLinkRequestSchema>;
