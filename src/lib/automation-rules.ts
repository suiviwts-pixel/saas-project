import { db } from "@/db";
import { automationRules } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function listAutomationRules(tenantId: string) {
  return db.select().from(automationRules).where(eq(automationRules.tenantId, tenantId)).orderBy(desc(automationRules.priority));
}

export async function createAutomationRule(params: {
  tenantId: string;
  storeId: string;
  name: string;
  description?: string;
  priority: number;
  triggerEvent: string;
  triggerConditions: Record<string, unknown>;
  actionType: string;
  actionConfig: Record<string, unknown>;
  createdBy: string;
}) {
  const [rule] = await db
    .insert(automationRules)
    .values({
      tenantId: params.tenantId,
      storeId: params.storeId,
      name: params.name,
      description: params.description,
      priority: params.priority,
      triggerEvent: params.triggerEvent as any,
      triggerConditions: params.triggerConditions as any,
      actionType: params.actionType as any,
      actionConfig: params.actionConfig,
      createdBy: params.createdBy,
    })
    .returning();
  return rule;
}

export async function toggleAutomationRule(tenantId: string, ruleId: string) {
  const [rule] = await db
    .select()
    .from(automationRules)
    .where(and(eq(automationRules.id, ruleId), eq(automationRules.tenantId, tenantId)))
    .limit(1);
  if (!rule) throw new Error("Rule not found");
  const [updated] = await db
    .update(automationRules)
    .set({ isActive: !rule.isActive })
    .where(eq(automationRules.id, ruleId))
    .returning();
  return updated;
}

export async function deleteAutomationRule(tenantId: string, ruleId: string) {
  await db.delete(automationRules).where(and(eq(automationRules.id, ruleId), eq(automationRules.tenantId, tenantId)));
}
