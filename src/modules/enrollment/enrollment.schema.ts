import { z } from "zod";
import { ENROLLMENT_TYPES } from "./enrollment.types.js";

export const createEnrollmentSchema = z.object({
  batch_id: z.string(),
});

export const submitPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.nativeEnum(ENROLLMENT_TYPES.PAYMENT_METHOD_OBJECT),
  transaction_id: z.string().min(3),
  screenshot_id: z.string().optional(), // ID from media upload
});

export const updateEnrollmentStatusSchema = z.object({
  status: z.nativeEnum(ENROLLMENT_TYPES.ENROLLMENT_STATUS_OBJECT),
});

export const updatePaymentStatusSchema = z.object({
  status: z.nativeEnum(ENROLLMENT_TYPES.PAYMENT_STATUS_OBJECT),
});

export const enrollmentQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  batch_id: z.string().optional(),
  student_id: z.string().optional(),
  teacher_id: z.string().optional(),
  status: z.nativeEnum(ENROLLMENT_TYPES.ENROLLMENT_STATUS_OBJECT).optional(),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type SubmitPaymentInput = z.infer<typeof submitPaymentSchema>;
export type UpdateEnrollmentStatusInput = z.infer<typeof updateEnrollmentStatusSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
export type EnrollmentQueryInput = z.infer<typeof enrollmentQuerySchema>;
