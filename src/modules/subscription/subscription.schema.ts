import { z } from "zod";

export const getPackagesSchema = z.object({
  status: z.string().optional().default("ACTIVE"),
});

export const createPackageSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  price_monthly: z.number().min(0).optional(),
  price_quarterly: z.number().min(0).optional(),
  price_yearly: z.number().min(0).optional(),
  price_lifetime: z.number().min(0).optional(),
  currency: z.string().max(10).optional().default("BDT"),
  max_services: z.number().int().min(1).optional().default(1),
  max_batches_per_service: z.number().int().min(1).optional().default(3),
  max_students_per_batch: z.number().int().min(1).optional(),
  can_use_online: z.boolean().optional().default(true),
  can_use_offline: z.boolean().optional().default(true),
  can_use_analytics: z.boolean().optional().default(false),
  can_export_data: z.boolean().optional().default(false),
  is_featured: z.boolean().optional().default(false),
  sort_order: z.number().int().optional().default(0),
  badge_label: z.string().max(50).optional(),
});

export const updatePackageSchema = createPackageSchema.partial();

export const packageFeatureSchema = z.object({
  label: z.string().min(1).max(200),
  is_included: z.boolean().optional().default(true),
  sort_order: z.number().int().optional().default(0),
});

export const grantSubscriptionSchema = z.object({
  user_id: z.string().min(1),
  package_id: z.string().min(1),
  billing_cycle: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "LIFETIME"]),
  expires_at: z.string().datetime().optional(),
});

export const subscribeSchema = z.object({
  package_id: z.string().min(1),
  billing_cycle: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "LIFETIME"]),
  payment_method: z.string().optional(),
  transaction_id: z.string().min(3).optional(),
  amount_paid: z.number().min(0).optional(),
});

export type PackageQueryInput = z.infer<typeof getPackagesSchema>;
export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type PackageFeatureInput = z.infer<typeof packageFeatureSchema>;
export type GrantSubscriptionInput = z.infer<typeof grantSubscriptionSchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
