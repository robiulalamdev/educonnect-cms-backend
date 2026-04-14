import { z } from "zod";

export const updateGuardianProfileSchema = z.object({
  occupation: z.string().optional(),
});

export type UpdateGuardianProfileInput = z.infer<typeof updateGuardianProfileSchema>;
