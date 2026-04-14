import { z } from "zod";
  import { USER_TYPES } from "../auth/auth.types.js";

// -- User Listing / Search --

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(USER_TYPES.ROLES).optional(),
  status: z.enum(USER_TYPES.STATUS).optional(),
  city: z.string().optional(),
  area: z.string().optional(),
});

// -- Types --

export type UserListQueryInput = z.infer<typeof userListQuerySchema>;
