import { prisma } from "../../config/prisma.js";
import { IAuditAction } from "./admin.types.js";

// ── Types ──────────────────────────────────────────────────

export type AuditLogQuery = {
  page?: number;
  limit?: number;
  admin_id?: string;
  action?: IAuditAction;
  target_type?: string;
  target_id?: string;
  start_date?: string;
  end_date?: string;
};

// ── Service ────────────────────────────────────────────────

/**
 * Persist an administrative action to the audit log.
 * This is usually called as a non-blocking background hook.
 */
export async function createAuditLog(
  adminId: string,
  action: IAuditAction,
  targetType: string,
  targetId: string,
  meta?: any
) {
  try {
    return await prisma.auditLog.create({
      data: {
        admin_id: adminId,
        action: action as any,
        target_type: targetType.toLowerCase(),
        target_id: targetId,
        meta: meta || {},
      },
    });
  } catch (error) {
    console.error(`[AuditLog Error] Failed to log action ${action}:`, error);
  }
}

/**
 * Retrieve audit logs with filtering and pagination
 */
export async function getAuditLogs(query: AuditLogQuery) {
  const { 
    page = 1, 
    limit = 20, 
    admin_id, 
    action, 
    target_type, 
    target_id, 
    start_date, 
    end_date 
  } = query;
  
  const skip = (page - 1) * limit;

  const where = {
    ...(admin_id && { admin_id }),
    ...(action && { action: action as any }),
    ...(target_type && { target_type: target_type.toLowerCase() }),
    ...(target_id && { target_id }),
    ...(start_date || end_date) && {
      created_at: {
        ...(start_date && { gte: new Date(start_date) }),
        ...(end_date && { lte: new Date(end_date) }),
      }
    }
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
        admin: {
          select: {
            id: true,
            full_name: true,
            email: true,
          }
        }
      }
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: logs,
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      has_next: page < Math.ceil(total / limit),
    },
  };
}
