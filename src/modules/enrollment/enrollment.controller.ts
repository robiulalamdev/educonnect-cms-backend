import { FastifyRequest, FastifyReply } from "fastify";
import { 
  createEnrollmentSchema, 
  submitPaymentSchema, 
  updatePaymentStatusSchema, 
  enrollmentQuerySchema 
} from "./enrollment.schema.js";
import { 
  createEnrollment, 
  submitPayment, 
  getEnrollmentList, 
  updatePaymentStatus, 
  getEnrollmentsDropdown 
} from "./enrollment.service.js";
import { dropdownQuerySchema } from "../education/education.schema.js";

export async function createEnrollmentController(req: FastifyRequest, reply: FastifyReply) {
  const studentId = req.user!.userId;
  const input = createEnrollmentSchema.parse(req.body);
  const data = await createEnrollment(studentId, input);
  return reply.send({ success: true, message: "Enrollment request submitted", data });
}

export async function submitPaymentController(req: FastifyRequest, reply: FastifyReply) {
  const studentId = req.user!.userId;
  const { id } = req.params as { id: string };
  const input = submitPaymentSchema.parse(req.body);
  const data = await submitPayment(studentId, id, input);
  return reply.send({ success: true, message: "Payment submitted for verification", data });
}

export async function getMyEnrollmentsController(req: FastifyRequest, reply: FastifyReply) {
  const studentId = req.user!.userId;
  const query = enrollmentQuerySchema.parse(req.query);
  const data = await getEnrollmentList({ ...query, student_id: studentId });
  return reply.send({ success: true, ...data });
}

export async function getTeacherEnrollmentsController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const query = enrollmentQuerySchema.parse(req.query);
  const data = await getEnrollmentList({ ...query, teacher_id: teacherId });
  return reply.send({ success: true, ...data });
}

export async function getAdminEnrollmentsController(req: FastifyRequest, reply: FastifyReply) {
  const query = enrollmentQuerySchema.parse(req.query);
  const data = await getEnrollmentList(query);
  return reply.send({ success: true, ...data });
}

export async function updatePaymentStatusController(req: FastifyRequest, reply: FastifyReply) {
  const actorId = req.admin?.userId || req.user?.userId;
  const is_admin = !!req.admin;
  const { id } = req.params as { id: string };
  const input = updatePaymentStatusSchema.parse(req.body);

  if (!actorId) return reply.status(401).send({ success: false, message: "Unauthorized" });

  const data = await updatePaymentStatus(actorId, is_admin, id, input);
  return reply.send({ success: true, message: `Payment ${input.status.toLowerCase()}`, data });
}

export async function getEnrollmentsDropdownController(req: FastifyRequest, reply: FastifyReply) {
  const query = dropdownQuerySchema.parse(req.query);
  const { batch_id } = req.query as { batch_id?: string };
  
  const context = {
    teacher_id: req.user?.role === "TEACHER" ? req.user.userId : undefined,
    batch_id
  };

  const data = await getEnrollmentsDropdown(query, context);
  return reply.send({ success: true, ...data });
}
