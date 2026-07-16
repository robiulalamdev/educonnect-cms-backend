import { FastifyRequest, FastifyReply } from "fastify";
import {
  getUserList,
  getUserById,
  approveTeacher,
  suspendUser,
  banUser,
  reactivateUser,
  deleteUser,
} from "./user-management.service.js";

export async function getUserListController(req: FastifyRequest, reply: FastifyReply) {
  const query = req.query as any;
  const data = await getUserList(query);
  return reply.send({ success: true, ...data });
}

export async function getUserByIdController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  try {
    const data = await getUserById(id);
    return reply.send({ success: true, data });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return reply.status(404).send({ success: false, message: "User not found" });
    throw err;
  }
}

export async function approveTeacherController(req: FastifyRequest, reply: FastifyReply) {
  const adminId = req.admin!.adminId;
  const { id } = req.params as { id: string };
  try {
    const data = await approveTeacher(adminId, id);
    return reply.send({ success: true, message: "Teacher approved", data });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return reply.status(404).send({ success: false, message: "User not found" });
    if (err.message === "MUST_BE_TEACHER") return reply.status(400).send({ success: false, message: "User is not a teacher" });
    if (err.message === "ALREADY_APPROVED") return reply.status(400).send({ success: false, message: "Teacher already approved" });
    throw err;
  }
}

export async function suspendUserController(req: FastifyRequest, reply: FastifyReply) {
  const adminId = req.admin!.adminId;
  const { id } = req.params as { id: string };
  try {
    const data = await suspendUser(adminId, id);
    return reply.send({ success: true, message: "User suspended", data });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return reply.status(404).send({ success: false, message: "User not found" });
    if (err.message === "ALREADY_SUSPENDED") return reply.status(400).send({ success: false, message: "User already suspended" });
    throw err;
  }
}

export async function banUserController(req: FastifyRequest, reply: FastifyReply) {
  const adminId = req.admin!.adminId;
  const { id } = req.params as { id: string };
  try {
    const data = await banUser(adminId, id);
    return reply.send({ success: true, message: "User banned", data });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return reply.status(404).send({ success: false, message: "User not found" });
    if (err.message === "ALREADY_BANNED") return reply.status(400).send({ success: false, message: "User already banned" });
    throw err;
  }
}

export async function reactivateUserController(req: FastifyRequest, reply: FastifyReply) {
  const adminId = req.admin!.adminId;
  const { id } = req.params as { id: string };
  try {
    const data = await reactivateUser(adminId, id);
    return reply.send({ success: true, message: "User reactivated", data });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return reply.status(404).send({ success: false, message: "User not found" });
    if (err.message === "ALREADY_ACTIVE") return reply.status(400).send({ success: false, message: "User already active" });
    throw err;
  }
}

export async function deleteUserController(req: FastifyRequest, reply: FastifyReply) {
  const adminId = req.admin!.adminId;
  const { id } = req.params as { id: string };
  try {
    await deleteUser(adminId, id);
    return reply.send({ success: true, message: "User deleted" });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return reply.status(404).send({ success: false, message: "User not found" });
    throw err;
  }
}
