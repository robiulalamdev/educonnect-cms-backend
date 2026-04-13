import { FastifyRequest, FastifyReply } from "fastify";
import { 
  getAdminStats, 
  getTeacherStats, 
  getStudentStats, 
  getGuardianStats 
} from "./statistics.service.js";

export async function getAdminStatsController(req: FastifyRequest, reply: FastifyReply) {
  const data = await getAdminStats();
  return reply.send({ success: true, data });
}

export async function getTeacherStatsController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const data = await getTeacherStats(teacherId);
  return reply.send({ success: true, data });
}

export async function getStudentStatsController(req: FastifyRequest, reply: FastifyReply) {
  const studentId = req.user!.userId;
  const data = await getStudentStats(studentId);
  return reply.send({ success: true, data });
}

export async function getGuardianStatsController(req: FastifyRequest, reply: FastifyReply) {
  const guardianId = req.user!.userId;
  const data = await getGuardianStats(guardianId);
  return reply.send({ success: true, data });
}
