import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import { ADMIN_TYPES } from "../admin/admin.types.js";
import {
  createDailyNoteController,
  getDailyNoteByIdController,
  getDailyNoteListController,
  getMyNotesController,
  updateDailyNoteController,
  deleteDailyNoteController,
} from "./daily-note.controller.js";

export async function dailyNoteRoutes(fastify: FastifyInstance) {
  // Teacher: create note for a batch
  fastify.post(
    "/batch/:batchId",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    createDailyNoteController,
  );

  // Teacher/Admin: list notes
  fastify.get(
    "/",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER, ...ADMIN_TYPES.PERMISSIONS.CAN_VIEW)] },
    getDailyNoteListController,
  );

  // Student: view own notes
  fastify.get(
    "/my",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.STUDENT)] },
    getMyNotesController,
  );

  // Get single note
  fastify.get(
    "/:id",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER, USER_TYPES.ROLE_OBJECT.STUDENT, USER_TYPES.ROLE_OBJECT.GUARDIAN)] },
    getDailyNoteByIdController,
  );

  // Teacher: update note
  fastify.patch(
    "/:id",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    updateDailyNoteController,
  );

  // Teacher: delete note
  fastify.delete(
    "/:id",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    deleteDailyNoteController,
  );
}
