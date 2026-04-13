import { FastifyRequest, FastifyReply } from "fastify";
import { packageQuerySchema, subscribeSchema } from "./subscription.schema.js";
import {
  getPackages,
  getUserSubscription,
  subscribeUser,
} from "./subscription.service.js";

/**
 * Handle listing packages
 */
export async function getPackagesController(req: FastifyRequest, reply: FastifyReply) {
  const query = packageQuerySchema.safeParse(req.query);
  if (!query.success) {
    return reply.status(400).send({
      success: false,
      errors: query.error.flatten().fieldErrors,
    });
  }

  const data = await getPackages(query.data);
  return reply.send({ success: true, data });
}

/**
 * Handle getting my subscription
 */
export async function getMySubscriptionController(req: FastifyRequest, reply: FastifyReply) {
  const data = await getUserSubscription(req.user!.userId);
  return reply.send({ success: true, data });
}

/**
 * Handle subscribing to a package
 */
export async function subscribeController(req: FastifyRequest, reply: FastifyReply) {
  const body = subscribeSchema.safeParse(req.body);
  if (!body.success) {
    return reply.status(400).send({
      success: false,
      errors: body.error.flatten().fieldErrors,
    });
  }

  try {
    const data = await subscribeUser(req.user!.userId, body.data);
    return reply.send({
      success: true,
      message: "Subscription processed successfully",
      data,
    });
  } catch (err: any) {
    if (err.message === "PACKAGE_NOT_FOUND") {
      return reply.status(404).send({ success: false, message: "Package not found" });
    }
    if (err.message === "PACKAGE_INACTIVE") {
      return reply.status(400).send({ success: false, message: "This package is not currently available" });
    }
    throw err;
  }
}
