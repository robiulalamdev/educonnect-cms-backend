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
  updateService, 
  getServicesDropdown 
} from "./service.service.js";
import { SERVICE_TYPES } from "./service.types.js";

export async function createServiceController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const input = createServiceSchema.parse(req.body);
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

export async function updateServiceController(req: FastifyRequest, reply: FastifyReply) {
  const teacherId = req.user!.userId;
  const { id } = req.params as { id: string };
  const input = updateServiceSchema.parse(req.body);
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
