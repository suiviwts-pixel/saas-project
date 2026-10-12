"use server";

import { getSession } from "@/lib/auth";
import { requirePermission, Permission } from "@/lib/permissions";
import { createManualOrder, dispatchOrderById, updateOrderStatus } from "@/lib/orders";
import { listStores } from "@/lib/stores";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type FormState = { error?: string; success?: string } | undefined;

export async function createOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  try {
    await requirePermission(session, Permission.ORDER_CREATE);

    const storeId = String(formData.get("storeId") || "");
    const stores = await listStores(session.tenantId);
    if (!stores.find((s) => s.id === storeId)) return { error: "يرجى اختيار متجر صالح" };

    const itemName = String(formData.get("itemName") || "منتج");
    const itemQty = Number(formData.get("itemQty") || 1);
    const itemPrice = Number(formData.get("itemPrice") || 0);

    const order = await createManualOrder(session.tenantId, {
      storeId,
      customer: {
        firstName: String(formData.get("firstName") || ""),
        lastName: String(formData.get("lastName") || ""),
        phone: String(formData.get("phone") || ""),
        email: String(formData.get("email") || "") || undefined,
        address: String(formData.get("address") || ""),
        city: String(formData.get("city") || ""),
        wilaya: String(formData.get("wilaya") || ""),
        country: "DZ",
      },
      items: [{ name: itemName, quantity: itemQty, price: itemPrice, total: itemQty * itemPrice }],
      shippingCost: Number(formData.get("shippingCost") || 0),
      paymentMethod: (String(formData.get("paymentMethod") || "cod") as any),
      createdBy: session.sub,
    });

    await logAudit({ tenantId: session.tenantId, userId: session.sub, action: "create", resource: "order", resourceId: order.id });

    revalidatePath("/dashboard/orders");
    return { success: `تم إنشاء الطلب ${order.externalOrderNumber} بنجاح` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "حدث خطأ" };
  }
}

export async function dispatchOrderAction(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await requirePermission(session, Permission.ORDER_DISPATCH);
  await dispatchOrderById(session.tenantId, orderId);
  await logAudit({ tenantId: session.tenantId, userId: session.sub, action: "dispatch", resource: "order", resourceId: orderId });
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
}

export async function updateStatusAction(orderId: string, status: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await requirePermission(session, Permission.ORDER_UPDATE);
  await updateOrderStatus(session.tenantId, orderId, status);
  await logAudit({ tenantId: session.tenantId, userId: session.sub, action: "update_status", resource: "order", resourceId: orderId, changes: { status } });
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
}
