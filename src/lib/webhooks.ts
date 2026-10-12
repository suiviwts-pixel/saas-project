import { db } from "@/db";
import { orders, stores } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createOrderFromWebhook } from "./orders";
import { triggerAutomationRules } from "./automation";

function toOrderItem(raw: any) {
  const quantity = Number(raw.quantity ?? 1);
  const price = Number(raw.price ?? 0);
  return {
    productId: raw.product_id?.toString() ?? raw.productId,
    sku: raw.sku,
    name: raw.name || raw.title || "منتج",
    quantity,
    price,
    total: Number(raw.total ?? price * quantity),
  };
}

export async function getStoreOrThrow(storeId: string) {
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) throw new Error("Store not found");
  return store;
}

export async function processShopifyWebhook(storeId: string, payload: any, topic?: string) {
  const store = await getStoreOrThrow(storeId);

  const customer = {
    firstName: payload.customer?.first_name || payload.shipping_address?.first_name || "Unknown",
    lastName: payload.customer?.last_name || payload.shipping_address?.last_name || "",
    phone: payload.customer?.phone || payload.shipping_address?.phone || "0000000000",
    email: payload.customer?.email || payload.email,
    address: payload.shipping_address?.address1 || "",
    city: payload.shipping_address?.city || "",
    wilaya: payload.shipping_address?.province || payload.shipping_address?.city || "غير محدد",
    postalCode: payload.shipping_address?.zip,
    country: payload.shipping_address?.country_code || "DZ",
  };

  const items = (payload.line_items || []).map(toOrderItem);

  const order = await createOrderFromWebhook(store.tenantId, store.id, {
    externalOrderId: String(payload.id ?? payload.order_number ?? Date.now()),
    externalOrderNumber: payload.name || String(payload.order_number ?? ""),
    customer,
    items,
    shippingCost: Number(payload.total_shipping_price_set?.shop_money?.amount || 0),
    taxAmount: Number(payload.total_tax || 0),
    discountAmount: Number(payload.total_discounts || 0),
    paymentMethod: payload.financial_status === "paid" ? "online" : "cod",
  });

  return { success: true, orderId: order.id, topic };
}

export async function processSallaWebhook(storeId: string, payload: any) {
  const store = await getStoreOrThrow(storeId);
  const data = payload.data || payload;

  const customer = {
    firstName: data.customer?.first_name || data.shipping?.first_name || "Unknown",
    lastName: data.customer?.last_name || data.shipping?.last_name || "",
    phone: data.customer?.mobile || data.shipping?.mobile || "0000000000",
    email: data.customer?.email,
    address: data.shipping?.address || "",
    city: data.shipping?.city || "",
    wilaya: data.shipping?.region || data.shipping?.city || "غير محدد",
    country: "DZ",
  };

  const items = (data.items || []).map((item: any) =>
    toOrderItem({ ...item, name: item.product?.name || item.name, product_id: item.product?.id }),
  );

  const order = await createOrderFromWebhook(store.tenantId, store.id, {
    externalOrderId: String(data.id ?? data.reference_id ?? Date.now()),
    externalOrderNumber: data.reference_id || String(data.id ?? ""),
    customer,
    items,
    shippingCost: Number(data.shipping?.cost || 0),
    paymentMethod: data.payment_method === "cod" ? "cod" : "online",
  });

  return { success: true, orderId: order.id };
}

export async function processWooCommerceWebhook(storeId: string, payload: any) {
  const store = await getStoreOrThrow(storeId);

  const customer = {
    firstName: payload.billing?.first_name || "Unknown",
    lastName: payload.billing?.last_name || "",
    phone: payload.billing?.phone || "0000000000",
    email: payload.billing?.email,
    address: payload.shipping?.address_1 || payload.billing?.address_1 || "",
    city: payload.shipping?.city || payload.billing?.city || "",
    wilaya: payload.shipping?.state || payload.shipping?.city || "غير محدد",
    postalCode: payload.shipping?.postcode,
    country: "DZ",
  };

  const items = (payload.line_items || []).map(toOrderItem);

  const order = await createOrderFromWebhook(store.tenantId, store.id, {
    externalOrderId: String(payload.id ?? Date.now()),
    externalOrderNumber: String(payload.number ?? payload.id ?? ""),
    customer,
    items,
    shippingCost: Number(payload.shipping_total || 0),
    taxAmount: Number(payload.total_tax || 0),
    discountAmount: Number(payload.discount_total || 0),
    paymentMethod: payload.payment_method === "cod" ? "cod" : "online",
  });

  return { success: true, orderId: order.id };
}

export async function processShippingWebhook(provider: string, storeId: string, payload: any) {
  const trackingNumber = payload.tracking_number || payload.trackingNumber;
  const status = (payload.status || "").toLowerCase();

  if (!trackingNumber || !status) {
    throw new Error("Missing tracking_number or status");
  }

  const statusMap: Record<string, string> = {
    new: "pending",
    pending: "processing",
    confirmed: "confirmed",
    shipped: "shipped",
    in_transit: "in_transit",
    out_for_delivery: "out_for_delivery",
    delivered: "delivered",
    failed: "failed",
    returned: "returned",
    cancelled: "cancelled",
  };
  const mappedStatus = statusMap[status] || "processing";

  const [order] = await db
    .update(orders)
    .set({ status: mappedStatus as any, shippingStatus: mappedStatus as any, updatedAt: new Date(), deliveredAt: mappedStatus === "delivered" ? new Date() : undefined })
    .where(and(eq(orders.storeId, storeId), eq(orders.trackingNumber, trackingNumber)))
    .returning();

  if (order) {
    await triggerAutomationRules(`order.${mappedStatus}` as any, storeId, order);
  }

  return { received: true, trackingNumber, status: mappedStatus };
}
