"use server";

import { getSession } from "@/lib/auth";
import { requirePermission, Permission } from "@/lib/permissions";
import { upgradePlan, type PlanType } from "@/lib/billing";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function upgradePlanAction(plan: PlanType) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await requirePermission(session, Permission.BILLING_MANAGE);
  await upgradePlan(session.tenantId, plan);
  await logAudit({ tenantId: session.tenantId, userId: session.sub, action: "upgrade_plan", resource: "subscription", changes: { plan } });
  revalidatePath("/dashboard/billing");
}
