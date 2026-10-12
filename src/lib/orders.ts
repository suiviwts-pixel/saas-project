import { db } from "@/db";
import { orders, stores, type OrderCustomer, type OrderItem } from "@/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { checkOrderLimit, incrementOrderCount } from "./billing";
import { autoDispatchIfConfigured, triggerAutomationRules } from "./automation";

export type CreateOrderInput = {
  storeId: string;
  externalOrderId?: string;
  externalOrderNumber?: string;
  customer: OrderCustomer;
  items: OrderItem[];
  shippingCost?: number;
  taxAmount?: number;
  discountAmount?: number;
  paymentMethod?: "cod" | "online" | "bank_transfer";
  notes?: string;
  createdBy?: string;
};

function computeTotals(items: OrderItem[], shippingCost = 0, taxAmount = 0, discountAmount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalPrice = subtotal + shippingCost + taxAmount - discountAmount;
  return { subtotal, totalPrice };
}

export async function createManualOrder(tenantId: string, input: CreateOrderInput) {
  await checkOrderLimit(tenantId);

  const [store] = await db
    .select()
    .from(stores)
    .where(and(eq(stores.id, input.storeId), eq(stores.tenantId, tenantId), eq(stores.isActive, true)))
    .limit(1);

  if (!store) {
    throw new Error("Store not found or access denied");
  }

  const { subtotal, totalPrice } = computeTotals(input.items, input.shippingCost, input.taxAmount, input.discountAmount);

  const [order] = await db
    .insert(orders)
    .values({
      tenantId,
      storeId: store.id,
      externalOrderId: input.externalOrderId || `manual-${Date.now()}`,
      externalOrderNumber: input.externalOrderNumber || `#${Date.now().toString().slice(-6)}`,
      customer: input.customer,
      items: input.items,
      subtotal: String(subtotal),
      shippingCost: String(input.shippingCost || 0),
      taxAmount: String(input.taxAmount || 0),
      discountAmount: String(input.discountAmount || 0),
      totalPrice: String(totalPrice),
      paymentMethod: input.paymentMethod || "cod",
      status: "pending",
      shippingStatus: "pending",
      notes: input.notes,
      createdBy: input.createdBy,
    })
    .returning();

  await incrementOrderCount(tenantId);
  await triggerAutomationRules("order.created", store.id, order);
  const finalOrder = await autoDispatchIfConfigured(order, store);

  return finalOrder;
}

export async function createOrderFromWebhook(
  tenantId: string,
  storeId: string,
  input: Omit<CreateOrderInput, "storeId">,
) {
  const [existing] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.externalOrderId, input.externalOrderId || ""), eq(orders.storeId, storeId)))
    .limit(1);

  if (existing) return existing;

  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) throw new Error("Store not found");

  try {
    await checkOrderLimit(tenantId);
  } catch {
    // Still record the order but mark it for manual review when plan limit is hit.
  }

  const { subtotal, totalPrice } = computeTotals(input.items, input.shippingCost, input.taxAmount, input.discountAmount);

  const [order] = await db
    .insert(orders)
    .values({
      tenantId,
      storeId,
      externalOrderId: input.externalOrderId || `ext-${Date.now()}`,
      externalOrderNumber: input.externalOrderNumber || `#${Date.now().toString().slice(-6)}`,
      customer: input.customer,
      items: input.items,
      subtotal: String(subtotal),
      shippingCost: String(input.shippingCost || 0),
      taxAmount: String(input.taxAmount || 0),
      discountAmount: String(input.discountAmount || 0),
      totalPrice: String(totalPrice),
      paymentMethod: input.paymentMethod || "cod",
      status: "pending",
      shippingStatus: "pending",
    })
    .returning();

  await incrementOrderCount(tenantId);
  await triggerAutomationRules("order.created", storeId, order);
  const finalOrder = await autoDispatchIfConfigured(order, store);

  return finalOrder;
}

export type OrderFilters = {
  storeId?: string;
  status?: string;
  wilaya?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export async function findAllOrders(tenantId: string, filters: OrderFilters = {}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const conditions = [eq(orders.tenantId, tenantId)];
  if (filters.storeId) conditions.push(eq(orders.storeId, filters.storeId));
  if (filters.status) conditions.push(eq(orders.status, filters.status as any));
  if (filters.wilaya) conditions.push(sql`${orders.customer}->>'wilaya' = ${filters.wilaya}`);
  if (filters.search) {
    conditions.push(
      or(
        ilike(orders.externalOrderNumber, `%${filters.search}%`),
        ilike(orders.trackingNumber, `%${filters.search}%`),
        sql`${orders.customer}->>'phone' ilike ${"%" + filters.search + "%"}`,
      )!,
    );
  }

  const where = and(...conditions);

  const [data, [{ count }]] = await Promise.all([
    db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(orders).where(where),
  ]);

  return { data, total: count, page, limit };
}

export async function findOrderById(tenantId: string, orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
    .limit(1);
  if (!order) throw new Error("Order not found");
  return order;
}

export async function updateOrderStatus(tenantId: string, orderId: string, status: string) {
  const order = await findOrderById(tenantId, orderId);
  const [updated] = await db
    .update(orders)
    .set({
      status: status as any,
      deliveredAt: status === "delivered" ? new Date() : order.deliveredAt,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();

  await triggerAutomationRules(`order.${status}` as any, order.storeId, updated);
  return updated;
}

export async function dispatchOrderById(tenantId: string, orderId: string) {
  const order = await findOrderById(tenantId, orderId);
  const [store] = await db.select().from(stores).where(eq(stores.id, order.storeId)).limit(1);
  if (!store) throw new Error("Store not found");

  const { dispatchOrder } = await import("./shipping/service");
  const { order: updated } = await dispatchOrder(order, store);
  await triggerAutomationRules("order.shipped", store.id, updated);
  return updated;
}
