import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export type PlanType = "free" | "starter" | "pro" | "business" | "enterprise";

export const PLAN_LIMITS: Record<PlanType, {
  label: string;
  ordersPerMonth: number;
  stores: number;
  teamMembers: number;
  automationRules: number;
  apiCallsPerDay: number;
  priceDZD: number;
}> = {
  free: { label: "مجانية", ordersPerMonth: 50, stores: 1, teamMembers: 1, automationRules: 3, apiCallsPerDay: 100, priceDZD: 0 },
  starter: { label: "Starter", ordersPerMonth: 500, stores: 2, teamMembers: 3, automationRules: 10, apiCallsPerDay: 1000, priceDZD: 2500 },
  pro: { label: "Pro", ordersPerMonth: 5000, stores: 5, teamMembers: 10, automationRules: 50, apiCallsPerDay: 10000, priceDZD: 7500 },
  business: { label: "Business", ordersPerMonth: 20000, stores: 15, teamMembers: 25, automationRules: 200, apiCallsPerDay: 50000, priceDZD: 20000 },
  enterprise: { label: "Enterprise", ordersPerMonth: Infinity, stores: Infinity, teamMembers: Infinity, automationRules: Infinity, apiCallsPerDay: Infinity, priceDZD: 0 },
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function getOrCreateSubscription(tenantId: string) {
  const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, tenantId)).limit(1);

  if (!existing) {
    const now = new Date();
    const [created] = await db
      .insert(subscriptions)
      .values({
        tenantId,
        plan: "free",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: addMonths(now, 1),
      })
      .returning();
    return created;
  }

  if (new Date() >= new Date(existing.currentPeriodEnd)) {
    const now = new Date();
    const [updated] = await db
      .update(subscriptions)
      .set({
        ordersThisMonth: 0,
        apiCallsToday: 0,
        currentPeriodStart: now,
        currentPeriodEnd: addMonths(now, 1),
      })
      .where(eq(subscriptions.tenantId, tenantId))
      .returning();
    return updated;
  }

  return existing;
}

export class LimitExceededError extends Error {}

export async function checkOrderLimit(tenantId: string): Promise<void> {
  const sub = await getOrCreateSubscription(tenantId);
  const limits = PLAN_LIMITS[sub.plan as PlanType];
  if (sub.ordersThisMonth >= limits.ordersPerMonth) {
    throw new LimitExceededError(
      `تم تجاوز حد الطلبات الشهري (${limits.ordersPerMonth}) لخطة ${limits.label}. يرجى ترقية الخطة.`,
    );
  }
}

export async function incrementOrderCount(tenantId: string): Promise<void> {
  const sub = await getOrCreateSubscription(tenantId);
  await db
    .update(subscriptions)
    .set({ ordersThisMonth: sub.ordersThisMonth + 1 })
    .where(eq(subscriptions.tenantId, tenantId));
}

export async function upgradePlan(tenantId: string, plan: PlanType) {
  await getOrCreateSubscription(tenantId);
  const [updated] = await db
    .update(subscriptions)
    .set({ plan, status: "active" })
    .where(eq(subscriptions.tenantId, tenantId))
    .returning();
  return updated;
}

export async function getUsageStats(tenantId: string) {
  const sub = await getOrCreateSubscription(tenantId);
  const limits = PLAN_LIMITS[sub.plan as PlanType];
  return {
    plan: sub.plan as PlanType,
    label: limits.label,
    status: sub.status,
    ordersUsed: sub.ordersThisMonth,
    ordersLimit: limits.ordersPerMonth,
    usagePercentage: limits.ordersPerMonth === Infinity ? 0 : Math.min(100, Math.round((sub.ordersThisMonth / limits.ordersPerMonth) * 100)),
    renewsAt: sub.currentPeriodEnd,
    price: limits.priceDZD,
    currency: sub.currency,
    limits,
  };
}
