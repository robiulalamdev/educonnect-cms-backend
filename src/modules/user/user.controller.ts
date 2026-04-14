import { FastifyRequest, FastifyReply } from "fastify";
import {
  userListQuerySchema,
} from "./user.schema.js";
import {
  getUsers,
  getUserById,
} from "./user.service.js";

/**
 * Handle listing/searching users
 */
export async function getUsersController(req: FastifyRequest, reply: FastifyReply) {
  const query = userListQuerySchema.safeParse(req.query);
  if (!query.success) {
    return reply.status(400).send({
      success: false,
      errors: query.error.flatten().fieldErrors,
    });
  }

  const result = await getUsers(query.data);
  return reply.send({ success: true, ...result });
}

/**
 * Handle getting a user by ID
 */
export async function getUserByIdController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };

  try {
    const user = await getUserById(id);
    return reply.send({ success: true, data: user });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      return reply.status(404).send({ success: false, message: "User not found" });
    }
    throw err;
  }
}
