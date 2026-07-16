import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { registerDevice, removeDevice, getDevices, deactivateAllDevices } from "./device.service.js";

const registerDeviceSchema = z.object({
  fcm_token: z.string().min(1),
  platform: z.enum(["web", "android", "ios"]),
});

export async function registerDeviceController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const input = registerDeviceSchema.parse(req.body);
  const data = await registerDevice(userId, input.fcm_token, input.platform);
  return reply.send({ success: true, data });
}

export async function removeDeviceController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const { fcm_token } = req.params as { fcm_token: string };
  await removeDevice(userId, fcm_token);
  return reply.send({ success: true, message: "Device removed" });
}

export async function getDevicesController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  const data = await getDevices(userId);
  return reply.send({ success: true, data });
}

export async function deactivateAllDevicesController(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.userId;
  await deactivateAllDevices(userId);
  return reply.send({ success: true, message: "All devices deactivated" });
}
