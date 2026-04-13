import { prisma } from "../../config/prisma.js";
import { PackageQueryInput, SubscribeInput } from "./subscription.schema.js";

/**
 * Get all available subscription packages with features
 */
export async function getPackages(query: PackageQueryInput) {
  return prisma.subscriptionPackage.findMany({
    where: { status: query.status as any }, // casting to bypass slight mismatch in generated types if any
    orderBy: { sort_order: "asc" },
    include: {
      features: {
        orderBy: { sort_order: "asc" },
      },
    },
  });
}

/**
 * Get active subscription for a specific user
 */
export async function getUserSubscription(userId: string) {
  return prisma.userSubscription.findUnique({
    where: { user_id: userId },
    include: {
      package: true,
    },
  });
}

/**
 * Create a subscription for a user
 * Note: Real payment gateway integration would happen before/during this call.
 * This function marks the intent and creates the record.
 */
export async function subscribeUser(userId: string, input: SubscribeInput) {
  const pkg = await prisma.subscriptionPackage.findUnique({
    where: { id: input.package_id },
  });

  if (!pkg) throw new Error("PACKAGE_NOT_FOUND");
  if (pkg.status !== "ACTIVE") throw new Error("PACKAGE_INACTIVE");

  // Determine price based on billing cycle
  let price = null;
  let durationMs = 0;

  switch (input.billing_cycle) {
    case "MONTHLY":
      price = pkg.price_monthly;
      durationMs = 30 * 24 * 60 * 60 * 1000;
      break;
    case "QUARTERLY":
      price = pkg.price_quarterly;
      durationMs = 90 * 24 * 60 * 60 * 1000;
      break;
    case "YEARLY":
      price = pkg.price_yearly;
      durationMs = 365 * 24 * 60 * 60 * 1000;
      break;
    case "LIFETIME":
      price = pkg.price_lifetime;
      durationMs = 0; // No expiry
      break;
  }

  const startedAt = new Date();
  const expiresAt = durationMs > 0 ? new Date(startedAt.getTime() + durationMs) : null;

  // Use a transaction to ensure both history and current subscription are consistent
  return prisma.$transaction(async (tx) => {
    // 1. Create history log with snapshot
    await tx.subscriptionHistory.create({
      data: {
        user_id: userId,
        package_id: pkg.id,
        status: "ACTIVE", // In real flow, might be PENDING until payment verification
        billing_cycle: input.billing_cycle,
        started_at: startedAt,
        expires_at: expiresAt,
        amount_paid: price,
        payment_method: input.payment_method as any,
        transaction_id: input.transaction_id,
        snapshot: {
          name: pkg.name,
          max_services: pkg.max_services,
          max_batches_per_service: pkg.max_batches_per_service,
          max_students_per_batch: pkg.max_students_per_batch,
          can_use_online: pkg.can_use_online,
          can_use_offline: pkg.can_use_offline,
        },
      },
    });

    // 2. Update or Create active subscription
    return tx.userSubscription.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        package_id: pkg.id,
        status: "ACTIVE",
        billing_cycle: input.billing_cycle,
        started_at: startedAt,
        expires_at: expiresAt,
      },
      update: {
        package_id: pkg.id,
        status: "ACTIVE",
        billing_cycle: input.billing_cycle,
        started_at: startedAt,
        expires_at: expiresAt,
      },
    });
  });
}
