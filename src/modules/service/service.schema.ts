import { z } from "zod";
import { SERVICE_TYPES } from "./service.types.js";

export const createServiceSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10),
  format: z.nativeEnum(SERVICE_TYPES.FORMAT_OBJECT),
  mode: z.nativeEnum(SERVICE_TYPES.MODE_OBJECT),
  country: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  address_line: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  meeting_platform: z.string().optional(),
  meeting_link: z.string().url().optional().or(z.literal("")),
  joining_fee: z.number().nonnegative().optional(),
  monthly_fee: z.number().nonnegative().optional(),
  per_session_fee: z.number().nonnegative().optional(),
  currency: z.string().default("BDT"),
  fee_note: z.string().optional(),
  subject_ids: z.array(z.string()).min(1),
  level_ids: z.array(z.string()).min(1),
  payment_methods: z.array(z.object({
    method: z.string(), // We'll cast to PaymentMethod enum in service
    account_name: z.string().optional(),
    account_number: z.string().optional(),
    instructions: z.string().optional(),
  })).optional(),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  status: z.nativeEnum(SERVICE_TYPES.STATUS_OBJECT).optional(),
});

export const serviceQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  q: z.string().optional(),
  teacher_id: z.string().optional(),
  subject_id: z.string().optional(),
  level_id: z.string().optional(),
  format: z.nativeEnum(SERVICE_TYPES.FORMAT_OBJECT).optional(),
  mode: z.nativeEnum(SERVICE_TYPES.MODE_OBJECT).optional(),
  status: z.nativeEnum(SERVICE_TYPES.STATUS_OBJECT).optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  min_fee: z.coerce.number().optional(),
  max_fee: z.coerce.number().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceQueryInput = z.infer<typeof serviceQuerySchema>;

export const dropdownQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
});
export type DropdownQueryInput = z.infer<typeof dropdownQuerySchema>;
