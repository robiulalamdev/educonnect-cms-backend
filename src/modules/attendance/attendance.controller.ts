import { FastifyRequest, FastifyReply } from "fastify";
import {
  markAttendanceSchema,
  bulkMarkAttendanceSchema,
  attendanceQuerySchema,
} from "./attendance.schema.js";
import {
  markAttendance,
  bulkMarkAttendance,
  getAttendanceList,
  getStudentAttendanceSummary,
} from "./attendance.service.js";

export async function markAttendanceController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { batchId } = req.params as { batchId: string };
  const input = markAttendanceSchema.parse(req.body);
  const data = await markAttendance(teacherId, batchId, input);
  return reply.send({ success: true, message: "Attendance marked", data });
}

export async function bulkMarkAttendanceController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { batchId } = req.params as { batchId: string };
  const input = bulkMarkAttendanceSchema.parse(req.body);
  const data = await bulkMarkAttendance(teacherId, batchId, input);
  return reply.send({ success: true, message: `Marked attendance for ${data.length} students`, data });
}

export async function getAttendanceListController(req: FastifyRequest, reply: FastifyReply) {
  const query = attendanceQuerySchema.parse(req.query);
  const data = await getAttendanceList(query);
  return reply.send({ success: true, ...data });
}

export async function getStudentAttendanceSummaryController(req: FastifyRequest, reply: FastifyReply) {
  const { batchId, studentProfileId } = req.params as { batchId: string; studentProfileId: string };
  const data = await getStudentAttendanceSummary(batchId, studentProfileId);
  return reply.send({ success: true, data });
}
