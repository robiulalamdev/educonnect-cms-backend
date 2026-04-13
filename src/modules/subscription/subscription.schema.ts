import { z } from "zod";

export const packageQuerySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional().default("ACTIVE"),
});

export const subscribeSchema = z.object({
  package_id: z.string().min(1, "Package ID is required"),
  billing_cycle: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "LIFETIME"]),
  payment_method: z.enum(["BKASH", "NAGAD", "ROCKET", "BANK_TRANSFER", "CASH", "OTHER"]),
  transaction_id: z.string().optional(),
});

export type PackageQueryInput = z.infer<typeof packageQuerySchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
