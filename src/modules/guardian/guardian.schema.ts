import { z } from "zod";

export const linkStudentSchema = z.object({
  student_identifier: z.string().min(1, "Student email or phone is required"),
});

export const respondToLinkSchema = z.object({
  link_id: z.string().min(1, "Link ID is required"),
  action: z.enum(["ACTIVE", "REJECTED"]),
});

export type LinkStudentInput = z.infer<typeof linkStudentSchema>;
export type RespondToLinkInput = z.infer<typeof respondToLinkSchema>;
