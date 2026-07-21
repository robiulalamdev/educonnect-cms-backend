import { z } from "zod";

// Allowed relation labels — family roles only (guardian is a user role, not a relation)
export const RELATION_LABELS = [
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Uncle",
  "Aunt",
  "Grandfather",
  "Grandmother",
  "Other",
] as const;

export const updateGuardianProfileSchema = z.object({
  occupation: z.string().optional(),
});

export const sendLinkRequestSchema = z.object({
  target_user_id: z.string().min(1),
  relation_label: z.enum(RELATION_LABELS).optional(),
});

export const respondLinkRequestSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT"]),
});

// Admin: direct link (no request flow)
export const adminDirectLinkSchema = z.object({
  guardian_user_id: z.string().min(1, "Guardian user ID is required"),
  student_user_id: z.string().min(1, "Student user ID is required"),
  relation_label: z.enum(RELATION_LABELS).default("Father"),
});

export type UpdateGuardianProfileInput = z.infer<typeof updateGuardianProfileSchema>;
export type SendLinkRequestInput = z.infer<typeof sendLinkRequestSchema>;
export type RespondLinkRequestInput = z.infer<typeof respondLinkRequestSchema>;
export type AdminDirectLinkInput = z.infer<typeof adminDirectLinkSchema>;
