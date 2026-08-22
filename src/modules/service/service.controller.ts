import { FastifyRequest, FastifyReply } from "fastify";
import { 
  createServiceSchema, 
  updateServiceSchema, 
  serviceQuerySchema, 
  dropdownQuerySchema 
} from "./service.schema.js";
import { 
  createService, 
  getServiceList, 
  getServiceById, 
  getServiceBySlug,
  updateService, 
  getServicesDropdown 
} from "./service.service.js";
import { SERVICE_TYPES } from "./service.types.js";
import { parseMultipart } from "../../utils/parse-multipart.js";

// Coerce multipart string fields to numbers before Zod validation
function coerceServiceFields(fields: Record<string, any>) {
  const numericKeys = [
    "latitude", "longitude", "joining_fee", "monthly_fee", "per_session_fee",
  ];
  const out = { ...fields };
  for (const key of numericKeys) {
    if (out[key] === undefined || out[key] === null) continue;
    const n = Number(out[key]);
    if (!Number.isNaN(n)) out[key] = n;
  }
  return out;
}

export async function createServiceController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const parsed = await parseMultipart(req, { allowedFileFields: {} });
  const input = createServiceSchema.parse(coerceServiceFields(parsed.fields));
  const data = await createService(teacherId, input);
  return reply.send({ success: true, message: "Service created successfully", data });
}

export async function getServiceListController(req: FastifyRequest, reply: FastifyReply) {
  const query = serviceQuerySchema.parse(req.query);
  const data = await getServiceList({ ...query, status: SERVICE_TYPES.STATUS_OBJECT.ACTIVE });
  return reply.send({ success: true, ...data });
}

export async function getTeacherServicesController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const query = serviceQuerySchema.parse(req.query);
  const data = await getServiceList({ ...query, teacher_id: teacherId });
  return reply.send({ success: true, ...data });
}

export async function getAdminServicesController(req: FastifyRequest, reply: FastifyReply) {
  const query = serviceQuerySchema.parse(req.query);
  const data = await getServiceList(query);
  return reply.send({ success: true, ...data });
}

export async function getServiceByIdController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const data = await getServiceById(id);
  return reply.send({ success: true, data });
}

export async function getServiceBySlugController(req: FastifyRequest, reply: FastifyReply) {
  const { slug } = req.params as { slug: string };
  try {
    const data = await getServiceBySlug(slug);
    return reply.send({ success: true, data });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      return reply.status(404).send({ success: false, message: "Service not found" });
    }
    throw err;
  }
}

export async function updateServiceController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { id } = req.params as { id: string };
  const parsed = await parseMultipart(req, { allowedFileFields: {} });
  const input = updateServiceSchema.parse(coerceServiceFields(parsed.fields));
  const data = await updateService(id, teacherId, input);
  return reply.send({ success: true, message: "Service updated successfully", data });
}

/**
 * Handle optimized dropdowns with context
 */
export async function getServicesDropdownController(req: FastifyRequest, reply: FastifyReply) {
  const query = dropdownQuerySchema.parse(req.query);
  
  // Logic: 
  // 1. If admin is requesting, show all services.
  // 2. If teacher is requesting, show their own services.
  // 3. Otherwise (public), show active services.
  
  const context = {
    teacher_id: req.user?.role === "TEACHER" ? req.user.userId : undefined,
    is_admin: !!req.admin
  };

  const data = await getServicesDropdown(query, context);
  return reply.send({ success: true, ...data });
}
