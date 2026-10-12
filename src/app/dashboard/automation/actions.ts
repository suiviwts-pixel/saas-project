"use server";

import { getSession } from "@/lib/auth";
import { requirePermission, Permission } from "@/lib/permissions";
import { createAutomationRule, toggleAutomationRule, deleteAutomationRule } from "@/lib/automation-rules";
import { listStores } from "@/lib/stores";
import { getUsageStats, PLAN_LIMITS } from "@/lib/billing";
import { db } from "@/db";
import { automationRules } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type FormState = { error?: string; success?: string } | undefined;

export async function createRuleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  try {
    await requirePermission(session, Permission.AUTOMATION_MANAGE);

    const storeId = String(formData.get("storeId") || "");
    const stores = await listStores(session.tenantId);
    if (!stores.find((s) => s.id === storeId)) return { error: "يرجى اختيار متجر صالح" };

    const existingCount = (await db.select().from(automationRules).where(eq(automationRules.tenantId, session.tenantId))).length;
    const usage = await getUsageStats(session.tenantId);
    const limits = PLAN_LIMITS[usage.plan];
    if (existingCount >= limits.automationRules) {
      return { error: `تم الوصول للحد الأقصى من قواعد الأتمتة (${limits.automationRules}) لخطتك الحالية.` };
    }

    const name = String(formData.get("name") || "").trim();
    if (!name) return { error: "يرجى إدخال اسم القاعدة" };

    const wilayaRaw = String(formData.get("wilaya") || "").trim();
    const conditions: Record<string, unknown> = {};
    if (wilayaRaw) conditions.wilaya = wilayaRaw.split(",").map((w) => w.trim()).filter(Boolean);

    const actionType = String(formData.get("actionType") || "send_whatsapp");
    const actionConfig: Record<string, unknown> = {};
    if (["send_whatsapp", "send_sms", "send_email"].includes(actionType)) {
      actionConfig.template = String(formData.get("template") || "مرحباً {{customerName}}، حالة طلبك: {{status}}. رقم التتبع: {{trackingNumber}}");
    }
    if (actionType === "update_status") {
      actionConfig.status = String(formData.get("newStatus") || "confirmed");
    }
    if (actionType === "assign_provider") {
      actionConfig.provider = String(formData.get("provider") || "zrexpress");
    }
    if (actionType === "notify_admin") {
      actionConfig.adminEmail = String(formData.get("adminEmail") || "admin@hanotify.local");
      actionConfig.message = String(formData.get("template") || "يحتاج هذا الطلب إلى مراجعة");
    }

    const rule = await createAutomationRule({
      tenantId: session.tenantId,
      storeId,
      name,
      description: String(formData.get("description") || ""),
      priority: Number(formData.get("priority") || 0),
      triggerEvent: String(formData.get("triggerEvent") || "order.created"),
      triggerConditions: conditions,
      actionType,
      actionConfig,
      createdBy: session.sub,
    });

    await logAudit({ tenantId: session.tenantId, userId: session.sub, action: "create", resource: "automation_rule", resourceId: rule.id });
    revalidatePath("/dashboard/automation");
    return { success: "تم إنشاء القاعدة بنجاح" };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "حدث خطأ" };
  }
}

export async function toggleRuleAction(ruleId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await requirePermission(session, Permission.AUTOMATION_MANAGE);
  await toggleAutomationRule(session.tenantId, ruleId);
  revalidatePath("/dashboard/automation");
}

export async function deleteRuleAction(ruleId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await requirePermission(session, Permission.AUTOMATION_MANAGE);
  await deleteAutomationRule(session.tenantId, ruleId);
  await logAudit({ tenantId: session.tenantId, userId: session.sub, action: "delete", resource: "automation_rule", resourceId: ruleId });
  revalidatePath("/dashboard/automation");
}
