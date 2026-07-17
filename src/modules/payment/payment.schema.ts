import { z } from "zod";

const PAYMENT_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
const PAYMENT_METHODS = ["BKASH", "NAGAD", "ROCKET", "BANK_TRANSFER", "CASH", "OTHER"] as const;

export const paymentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(PAYMENT_STATUSES).optional(),
  method: z.enum(PAYMENT_METHODS).optional(),
  batch_id: z.string().optional(),
  student_id: z.string().optional(),
  teacher_id: z.string().optional(),
  search: z.string().optional(),
});

export type PaymentListQueryInput = z.infer<typeof paymentListQuerySchema>;
