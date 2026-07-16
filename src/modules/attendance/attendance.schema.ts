import { z } from "zod";
import { ATTENDANCE_TYPES } from "./attendance.types.js";

export const markAttendanceSchema = z.object({
  student_profile_id: z.string().min(1),
  class_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.nativeEnum(ATTENDANCE_TYPES.STATUS_OBJECT),
  note: z.string().max(500).optional(),
});

export const bulkMarkAttendanceSchema = z.object({
  class_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(
    z.object({
      student_profile_id: z.string().min(1),
      status: z.nativeEnum(ATTENDANCE_TYPES.STATUS_OBJECT),
      note: z.string().max(500).optional(),
    })
  ).min(1).max(100),
});

export const attendanceQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  batch_id: z.string().optional(),
  student_profile_id: z.string().optional(),
  class_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.nativeEnum(ATTENDANCE_TYPES.STATUS_OBJECT).optional(),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type BulkMarkAttendanceInput = z.infer<typeof bulkMarkAttendanceSchema>;
export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>;
