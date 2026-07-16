import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { USER_TYPES } from "../auth/auth.types.js";
import { ADMIN_TYPES } from "../admin/admin.types.js";
import {
  createTaskController,
  getTaskByIdController,
  getTaskListController,
  getMyTasksController,
  updateTaskController,
  deleteTaskController,
} from "./task.controller.js";

export async function taskRoutes(fastify: FastifyInstance) {
  // Teacher: create task for a batch
  fastify.post(
    "/batch/:batchId",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    createTaskController,
  );

  // Teacher/Admin: list tasks
  fastify.get(
    "/",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER, ...ADMIN_TYPES.PERMISSIONS.CAN_VIEW)] },
    getTaskListController,
  );

  // Student: view own tasks
  fastify.get(
    "/my",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.STUDENT)] },
    getMyTasksController,
  );

  // Get single task
  fastify.get(
    "/:id",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER, USER_TYPES.ROLE_OBJECT.STUDENT, USER_TYPES.ROLE_OBJECT.GUARDIAN)] },
    getTaskByIdController,
  );

  // Teacher: update task
  fastify.patch(
    "/:id",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    updateTaskController,
  );

  // Teacher: delete task
  fastify.delete(
    "/:id",
    { preHandler: [authenticate, requireRole(USER_TYPES.ROLE_OBJECT.TEACHER)] },
    deleteTaskController,
  );
}
