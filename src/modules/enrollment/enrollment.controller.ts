import { FastifyRequest, FastifyReply } from "fastify";
import {
  createEnrollmentSchema,
  submitPaymentSchema,
  updatePaymentStatusSchema,
  updateEnrollmentStatusSchema,
  enrollmentQuerySchema,
} from "./enrollment.schema.js";
import {
  createEnrollment,
  submitPayment,
  getEnrollmentList,
  updatePaymentStatus,
  updateEnrollmentStatus,
  getEnrollmentsDropdown,
} from "./enrollment.service.js";
import { dropdownQuerySchema } from "../education/education.schema.js";
import { parseMultipart, MultipartValidationError } from "../../utils/parse-multipart.js";
import { CLD_FOLDERS } from "../../config/cloudinary.js";

export async function createEnrollmentController(req: FastifyRequest, reply: FastifyReply) {
  const studentId = req.user!.userId;
  const input = createEnrollmentSchema.parse(req.body);
  const data = await createEnrollment(studentId, input);
  return reply.send({ success: true, message: "Enrollment request submitted", data });
}

export async function submitPaymentController(req: FastifyRequest, reply: FastifyReply) {
  const studentId = req.user!.userId;
  const { id } = req.params as { id: string };

  let fields: Record<string, any>;
  let screenshotFile: import("../../utils/parse-multipart.js").ParsedFile | undefined;

  try {
    const parsed = await parseMultipart(req, {
      allowedFileFields: {
        screenshot: { folder: CLD_FOLDERS.PAYMENT_SCREENSHOTS, maxCount: 1, required: false },
      },
    });
    fields = parsed.fields;
    screenshotFile = parsed.files["screenshot"]?.[0];
  } catch (err) {
    if (err instanceof MultipartValidationError) {
      return reply.status(400).send({ success: false, message: err.message, field: err.field });
    }
    throw err;
  }

  const input = submitPaymentSchema.parse(fields);

  const screenshotUpload = screenshotFile
    ? {
        buffer: screenshotFile.buffer,
        mimetype: screenshotFile.mimetype,
        originalFilename: screenshotFile.filename,
        folder: CLD_FOLDERS.PAYMENT_SCREENSHOTS,
        size: screenshotFile.size,
      }
    : undefined;

  const data = await submitPayment(studentId, id, input, screenshotUpload);
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
  const actorId = req.admin?.adminId || req.user?.userId;
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
    batch_id,
  };

  const data = await getEnrollmentsDropdown(query, context);
  return reply.send({ success: true, ...data });
}

export async function updateEnrollmentStatusController(req: FastifyRequest, reply: FastifyReply) {
  const actorId = req.admin?.adminId || req.user?.userId;
  const is_admin = !!req.admin;
  const { id } = req.params as { id: string };
  const input = updateEnrollmentStatusSchema.parse(req.body);

  if (!actorId) return reply.status(401).send({ success: false, message: "Unauthorized" });

  try {
    const data = await updateEnrollmentStatus(actorId, is_admin, id, input);
    return reply.send({ success: true, message: `Enrollment ${input.status.toLowerCase()}`, data });
  } catch (err: any) {
    if (err.message === "ENROLLMENT_NOT_FOUND")
      return reply.status(404).send({ success: false, message: "Enrollment not found" });
    if (err.message === "FORBIDDEN")
      return reply.status(403).send({ success: false, message: "Forbidden" });
    throw err;
  }
}
