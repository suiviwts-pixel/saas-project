import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function logAudit(params: {
  tenantId: string;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  changes?: Record<string, unknown>;
}) {
  try {
    await db.insert(auditLogs).values({
      tenantId: params.tenantId,
      userId: params.userId ?? null,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId ?? null,
      changes: params.changes ?? {},
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}
