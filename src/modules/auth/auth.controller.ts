import type { FastifyReply, FastifyRequest } from "fastify";

async function getAuthController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({
    message: "Hello World",
  });
}

const authController = {
  getAuthController,
};

export { authController };
