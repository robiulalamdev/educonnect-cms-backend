import { z } from "zod";
import { SUBSCRIPTION_TYPES } from "./subscription.types.js";

export const packageQuerySchema = z.object({
  status: z.enum(SUBSCRIPTION_TYPES.PACKAGE_STATUS).optional().default("ACTIVE"),
});

export const subscribeSchema = z.object({
  package_id: z.string().min(1, "Package ID is required"),
  billing_cycle: z.enum(SUBSCRIPTION_TYPES.BILLING_CYCLES),
  payment_method: z.enum(SUBSCRIPTION_TYPES.PAYMENT_METHODS),
  transaction_id: z.string().optional(),
});

export type PackageQueryInput = z.infer<typeof packageQuerySchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
