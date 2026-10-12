import { db } from "@/db";
import { orders, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getShippingProvider } from "./factory";
import type { ShipOrderInput } from "./types";

export async function dispatchOrder(order: typeof orders.$inferSelect, store: typeof stores.$inferSelect) {
  const providerName = store.shippingConfig?.defaultProvider || "zrexpress";
  const provider = getShippingProvider(providerName);
  const credentials = store.shippingConfig?.credentials || {};
  const settings = store.shippingConfig?.settings || {
    autoDispatch: false,
    requireManualApproval: false,
    defaultServiceType: "standard",
    insuranceEnabled: false,
  };

  const input: ShipOrderInput = {
    id: order.id,
    externalOrderId: order.externalOrderId,
    customer: order.customer,
    items: order.items,
    totalPrice: Number(order.totalPrice),
  };

  const result = await provider.createShipment(input, credentials, settings);

  const [updated] = await db
    .update(orders)
    .set({
      status: "confirmed",
      shippingStatus: "shipped",
      trackingNumber: result.trackingNumber,
      shippingProvider: providerName,
      shippingLabelUrl: result.labelUrl,
      shippingCost: String(result.cost),
      dispatchedAt: new Date(),
      retryCount: 0,
      lastError: null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id))
    .returning();

  return { order: updated, result, provider: providerName };
}
