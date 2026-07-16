import { prisma } from "../../config/prisma.js";
import {
  PackageQueryInput,
  CreatePackageInput,
  UpdatePackageInput,
  PackageFeatureInput,
  GrantSubscriptionInput,
  SubscribeInput,
} from "./subscription.schema.js";
import { createNotification } from "../notification/notification.service.js";

// ── Public ─────────────────────────────────────────────────

export async function getPackages(query: PackageQueryInput) {
  return prisma.subscriptionPackage.findMany({
    where: { status: query.status as any },
    orderBy: { sort_order: "asc" },
    include: { features: { orderBy: { sort_order: "asc" } } },
  });
}

export async function getPackageById(id: string) {
  const pkg = await prisma.subscriptionPackage.findUnique({
    where: { id },
    include: { features: { orderBy: { sort_order: "asc" } } },
  });
  if (!pkg) throw new Error("NOT_FOUND");
  return pkg;
}

export async function getUserSubscription(userId: string) {
  const subscription = await prisma.userSubscription.findUnique({
    where: { user_id: userId },
    include: { package: true },
  });

  // Auto-expire if past expiry date
  if (subscription?.expires_at && subscription.status === "ACTIVE" && new Date(subscription.expires_at) < new Date()) {
    await prisma.userSubscription.update({
      where: { user_id: userId },
      data: { status: "EXPIRED" },
    });
    return { ...subscription, status: "EXPIRED" };
  }

  return subscription;
}

/**
 * Expire all subscriptions past their expiry date.
 * Call this periodically (e.g., via cron job or on server start).
 */
export async function expireSubscriptions(): Promise<number> {
  const result = await prisma.userSubscription.updateMany({
    where: {
      status: "ACTIVE",
      expires_at: { not: null, lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });

  if (result.count > 0) {
    console.log(`[Subscription] Expired ${result.count} subscriptions`);
  }

  return result.count;
}

export async function getSubscriptionHistory(userId: string) {
  return prisma.subscriptionHistory.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    include: { package: { select: { id: true, name: true } } },
  });
}

export async function subscribeUser(userId: string, input: SubscribeInput) {
  const pkg = await prisma.subscriptionPackage.findUnique({
    where: { id: input.package_id },
  });

  if (!pkg) throw new Error("PACKAGE_NOT_FOUND");
  if (pkg.status !== "ACTIVE") throw new Error("PACKAGE_INACTIVE");

  let price = null;
  let durationMs = 0;

  switch (input.billing_cycle) {
    case "MONTHLY": price = pkg.price_monthly; durationMs = 30 * 24 * 60 * 60 * 1000; break;
    case "QUARTERLY": price = pkg.price_quarterly; durationMs = 90 * 24 * 60 * 60 * 1000; break;
    case "YEARLY": price = pkg.price_yearly; durationMs = 365 * 24 * 60 * 60 * 1000; break;
    case "LIFETIME": price = pkg.price_lifetime; durationMs = 0; break;
  }

  const startedAt = new Date();
  const expiresAt = durationMs > 0 ? new Date(startedAt.getTime() + durationMs) : null;

  return prisma.$transaction(async (tx) => {
    await tx.subscriptionHistory.create({
      data: {
        user_id: userId,
        package_id: pkg.id,
        status: "ACTIVE",
        billing_cycle: input.billing_cycle,
        started_at: startedAt,
        expires_at: expiresAt,
        amount_paid: input.amount_paid ?? price,
        payment_method: input.payment_method as any,
        transaction_id: input.transaction_id,
        snapshot: {
          name: pkg.name,
          max_services: pkg.max_services,
          max_batches_per_service: pkg.max_batches_per_service,
          max_students_per_batch: pkg.max_students_per_batch,
        },
      },
    });

    return tx.userSubscription.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        package_id: pkg.id,
        status: "ACTIVE",
        billing_cycle: input.billing_cycle,
        started_at: startedAt,
        expires_at: expiresAt,
        payment_method: input.payment_method as any,
        transaction_id: input.transaction_id,
        amount_paid: input.amount_paid ?? price,
      },
      update: {
        package_id: pkg.id,
        status: "ACTIVE",
        billing_cycle: input.billing_cycle,
        started_at: startedAt,
        expires_at: expiresAt,
        payment_method: input.payment_method as any,
        transaction_id: input.transaction_id,
        amount_paid: input.amount_paid ?? price,
      },
    });
  });
}

// ── Admin CRUD ─────────────────────────────────────────────

export async function createPackage(input: CreatePackageInput) {
  const existing = await prisma.subscriptionPackage.findUnique({
    where: { slug: input.slug },
  });
  if (existing) throw new Error("SLUG_TAKEN");

  return prisma.subscriptionPackage.create({
    data: input,
    include: { features: true },
  });
}

export async function updatePackage(id: string, input: UpdatePackageInput) {
  const pkg = await prisma.subscriptionPackage.findUnique({ where: { id } });
  if (!pkg) throw new Error("NOT_FOUND");

  if (input.slug && input.slug !== pkg.slug) {
    const existing = await prisma.subscriptionPackage.findUnique({ where: { slug: input.slug } });
    if (existing) throw new Error("SLUG_TAKEN");
  }

  return prisma.subscriptionPackage.update({
    where: { id },
    data: input,
    include: { features: { orderBy: { sort_order: "asc" } } },
  });
}

export async function archivePackage(id: string) {
  const pkg = await prisma.subscriptionPackage.findUnique({ where: { id } });
  if (!pkg) throw new Error("NOT_FOUND");

  return prisma.subscriptionPackage.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

export async function addPackageFeature(packageId: string, input: PackageFeatureInput) {
  const pkg = await prisma.subscriptionPackage.findUnique({ where: { id: packageId } });
  if (!pkg) throw new Error("NOT_FOUND");

  return prisma.packageFeature.create({
    data: { package_id: packageId, ...input },
  });
}

export async function deletePackageFeature(packageId: string, featureId: string) {
  const feature = await prisma.packageFeature.findUnique({
    where: { id: featureId },
  });
  if (!feature || feature.package_id !== packageId) throw new Error("NOT_FOUND");

  await prisma.packageFeature.delete({ where: { id: featureId } });
}

// ── Admin Grant/Revoke ─────────────────────────────────────

export async function grantSubscription(adminId: string, input: GrantSubscriptionInput) {
  const { user_id, package_id, billing_cycle, expires_at } = input;

  const user = await prisma.user.findUnique({ where: { id: user_id } });
  if (!user) throw new Error("USER_NOT_FOUND");

  const pkg = await prisma.subscriptionPackage.findUnique({ where: { id: package_id } });
  if (!pkg) throw new Error("PACKAGE_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    await tx.subscriptionHistory.create({
      data: {
        user_id,
        package_id,
        status: "ACTIVE",
        billing_cycle,
        started_at: new Date(),
        expires_at: expires_at ? new Date(expires_at) : null,
        snapshot: { name: pkg.name, max_services: pkg.max_services },
      },
    });

    const sub = await tx.userSubscription.upsert({
      where: { user_id },
      create: {
        user_id,
        package_id,
        status: "ACTIVE",
        billing_cycle,
        started_at: new Date(),
        expires_at: expires_at ? new Date(expires_at) : null,
      },
      update: {
        package_id,
        status: "ACTIVE",
        billing_cycle,
        started_at: new Date(),
        expires_at: expires_at ? new Date(expires_at) : null,
      },
    });

    createNotification({
      user_id,
      type: "ACCOUNT_APPROVED",
      title: "Subscription Granted",
      body: `You have been granted the ${pkg.name} package`,
      reference_type: "subscription",
      reference_id: sub.id,
      category: "payment",
    }).catch(console.error);

    return sub;
  });
}

export async function revokeSubscription(userId: string) {
  const sub = await prisma.userSubscription.findUnique({ where: { user_id: userId } });
  if (!sub) throw new Error("NOT_FOUND");

  return prisma.userSubscription.update({
    where: { user_id: userId },
    data: { status: "CANCELLED" },
  });
}
