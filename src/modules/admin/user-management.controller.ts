import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
  getUserList,
  getUserById,
  createUserByAdmin,
  updateUserByAdmin,
  approveTeacher,
  rejectTeacher,
  suspendUser,
  banUser,
  reactivateUser,
  deleteUser,
  getTeacherList,
} from "./user-management.service.js";

const createUserSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["TEACHER", "STUDENT", "GUARDIAN"]),
  phone: z.string().optional(),
});

const updateUserSchema = z.object({
  full_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(["TEACHER", "STUDENT", "GUARDIAN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]).optional(),
});

const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  is_approved: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

export async function createUserByAdminController(req: FastifyRequest, reply: FastifyReply) {
  const adminId = req.admin!.adminId;
  const body = createUserSchema.safeParse(req.body);
  if (!body.success)
    return reply.status(400).send({ success: false, errors: body.error.flatten().fieldErrors });
  try {
    const data = await createUserByAdmin(adminId, body.data);
    return reply.status(201).send({ success: true, message: "User created", data });
  } catch (err: any) {
    if (err.message === "EMAIL_TAKEN")
      return reply.status(409).send({ success: false, message: "Email already in use" });
    throw err;
  }
}

export async function updateUserByAdminController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const body = updateUserSchema.safeParse(req.body);
  if (!body.success)
    return reply.status(400).send({ success: false, errors: body.error.flatten().fieldErrors });
  try {
    const data = await updateUserByAdmin(id, body.data);
    return reply.send({ success: true, message: "User updated", data });
  } catch (err: any) {
    if (err.message === "NOT_FOUND")
      return reply.status(404).send({ success: false, message: "User not found" });
    if (err.message === "EMAIL_TAKEN")
      return reply.status(409).send({ success: false, message: "Email already in use" });
    throw err;
  }
}

export async function getUserListController(req: FastifyRequest, reply: FastifyReply) {
  const query = userListQuerySchema.safeParse(req.query);
  if (!query.success)
    return reply.status(400).send({ success: false, errors: query.error.flatten().fieldErrors });
  const data = await getUserList(query.data);
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

export async function getTeacherListController(req: FastifyRequest, reply: FastifyReply) {
  const query = userListQuerySchema.safeParse(req.query);
  if (!query.success)
    return reply.status(400).send({ success: false, errors: query.error.flatten().fieldErrors });
  const data = await getTeacherList(query.data);
  return reply.send({ success: true, ...data });
}

export async function rejectTeacherController(req: FastifyRequest, reply: FastifyReply) {
  const adminId = req.admin!.adminId;
  const { id } = req.params as { id: string };
  try {
    const data = await rejectTeacher(adminId, id);
    return reply.send({ success: true, message: "Teacher rejected", data });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return reply.status(404).send({ success: false, message: "User not found" });
    if (err.message === "MUST_BE_TEACHER") return reply.status(400).send({ success: false, message: "User is not a teacher" });
    if (err.message === "ALREADY_APPROVED") return reply.status(400).send({ success: false, message: "Teacher already approved" });
    throw err;
  }
}
