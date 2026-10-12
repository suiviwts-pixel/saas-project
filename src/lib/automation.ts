import { db } from "@/db";
import { automationRules, orders, stores } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { sendNotification, renderTemplate } from "./notifications/service";
import { dispatchOrder } from "./shipping/service";

type AutomationEvent =
  | "order.created"
  | "order.confirmed"
  | "order.shipped"
  | "order.delivered"
  | "order.failed"
  | "order.returned"
  | "order.cancelled"
  | "tracking.updated";

function evaluateConditions(conditions: Record<string, unknown> | null | undefined, order: typeof orders.$inferSelect): boolean {
  if (!conditions) return true;
  const c = conditions as {
    wilaya?: string[];
    paymentMethod?: string[];
    totalPriceMin?: number;
    totalPriceMax?: number;
    shippingProvider?: string[];
  };

  if (c.wilaya && c.wilaya.length > 0 && !c.wilaya.includes(order.customer.wilaya)) return false;
  if (c.paymentMethod && c.paymentMethod.length > 0 && !c.paymentMethod.includes(order.paymentMethod)) return false;
  if (c.totalPriceMin !== undefined && Number(order.totalPrice) < c.totalPriceMin) return false;
  if (c.totalPriceMax !== undefined && Number(order.totalPrice) > c.totalPriceMax) return false;
  if (c.shippingProvider && c.shippingProvider.length > 0 && order.shippingProvider && !c.shippingProvider.includes(order.shippingProvider)) return false;

  return true;
}

export async function triggerAutomationRules(event: AutomationEvent, storeId: string, order: typeof orders.$inferSelect) {
  const rules = await db
    .select()
    .from(automationRules)
    .where(and(eq(automationRules.storeId, storeId), eq(automationRules.triggerEvent, event), eq(automationRules.isActive, true)))
    .orderBy(desc(automationRules.priority));

  if (rules.length === 0) return;

  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);

  for (const rule of rules) {
    if (!evaluateConditions(rule.triggerConditions, order)) continue;

    try {
      await executeAction(rule, order, store);
      await db
        .update(automationRules)
        .set({ executionCount: rule.executionCount + 1, lastExecutedAt: new Date() })
        .where(eq(automationRules.id, rule.id));
    } catch (error) {
      console.error(`Automation rule ${rule.id} failed:`, error);
    }
  }
}

async function executeAction(
  rule: typeof automationRules.$inferSelect,
  order: typeof orders.$inferSelect,
  store: typeof stores.$inferSelect | undefined,
) {
  const config = (rule.actionConfig || {}) as Record<string, any>;
  const variables = {
    customerName: `${order.customer.firstName} ${order.customer.lastName}`,
    trackingNumber: order.trackingNumber || "N/A",
    status: order.status,
    totalPrice: Number(order.totalPrice),
    storeName: store?.name || "متجرنا",
  };

  switch (rule.actionType) {
    case "send_whatsapp":
    case "send_sms":
    case "send_email": {
      const channel = rule.actionType === "send_whatsapp" ? "whatsapp" : rule.actionType === "send_sms" ? "sms" : "email";
      const template = config.template || "مرحباً {{customerName}}، حالة طلبك الحالية: {{status}}. رقم التتبع: {{trackingNumber}}";
      const message = renderTemplate(template, variables);
      const channelCfg = (store?.notificationConfig as any)?.[channel];
      await sendNotification({
        tenantId: order.tenantId,
        storeId: order.storeId,
        orderId: order.id,
        channel,
        to: channel === "email" ? order.customer.email || "" : order.customer.phone,
        message,
        credentials: channelCfg?.apiUrl ? { apiUrl: channelCfg.apiUrl, apiKey: channelCfg.apiKey } : undefined,
      });
      break;
    }
    case "notify_admin": {
      await sendNotification({
        tenantId: order.tenantId,
        storeId: order.storeId,
        orderId: order.id,
        channel: "email",
        to: config.adminEmail || "admin@hanotify.local",
        message: config.message || `تنبيه: الطلب ${order.externalOrderNumber} يحتاج مراجعة.`,
      });
      break;
    }
    case "assign_provider": {
      if (store && config.provider) {
        await db
          .update(stores)
          .set({ shippingConfig: { ...store.shippingConfig, defaultProvider: config.provider } })
          .where(eq(stores.id, store.id));
      }
      break;
    }
    case "update_status": {
      if (config.status) {
        await db.update(orders).set({ status: config.status, updatedAt: new Date() }).where(eq(orders.id, order.id));
      }
      break;
    }
    case "cancel_order": {
      await db.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, order.id));
      break;
    }
    case "webhook_outgoing": {
      if (config.url) {
        try {
          await fetch(config.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: rule.triggerEvent, order }),
            signal: AbortSignal.timeout(8000),
          });
        } catch (error) {
          console.error("webhook_outgoing failed", error);
        }
      }
      break;
    }
  }
}

export async function autoDispatchIfConfigured(order: typeof orders.$inferSelect, store: typeof stores.$inferSelect) {
  if (store.shippingConfig?.settings?.autoDispatch) {
    try {
      const { order: updated } = await dispatchOrder(order, store);
      return updated;
    } catch (error) {
      await db
        .update(orders)
        .set({ lastError: error instanceof Error ? error.message : "dispatch failed", retryCount: order.retryCount + 1 })
        .where(eq(orders.id, order.id));
    }
  }
  return order;
}
