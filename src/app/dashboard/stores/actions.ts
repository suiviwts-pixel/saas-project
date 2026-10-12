"use server";

import { getSession } from "@/lib/auth";
import { requirePermission, Permission } from "@/lib/permissions";
import { createStore, updateShippingConfig, updateNotificationConfig, toggleStoreActive, listStores } from "@/lib/stores";
import { getUsageStats, PLAN_LIMITS } from "@/lib/billing";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type FormState = { error?: string; success?: string } | undefined;

export async function createStoreAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  try {
    await requirePermission(session, Permission.STORE_CREATE);

    const existing = await listStores(session.tenantId);
    const usage = await getUsageStats(session.tenantId);
    const limits = PLAN_LIMITS[usage.plan];
    if (existing.length >= limits.stores) {
      return { error: `تم الوصول للحد الأقصى من المتاجر (${limits.stores}) لخطتك الحالية.` };
    }

    const name = String(formData.get("name") || "").trim();
    const platform = String(formData.get("platform") || "custom") as "shopify" | "salla" | "woocommerce" | "custom";
    const storeUrl = String(formData.get("storeUrl") || "").trim();

    if (!name) return { error: "يرجى إدخال اسم المتجر" };

    const store = await createStore({ tenantId: session.tenantId, ownerId: session.sub, name, platform, storeUrl });
    await logAudit({ tenantId: session.tenantId, userId: session.sub, action: "create", resource: "store", resourceId: store.id });

    revalidatePath("/dashboard/stores");
    return { success: "تم إنشاء المتجر بنجاح" };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "حدث خطأ" };
  }
}

export async function updateShippingConfigAction(storeId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  try {
    await requirePermission(session, Permission.STORE_UPDATE);

    const defaultProvider = String(formData.get("defaultProvider") || "zrexpress") as any;
    const apiKey = String(formData.get("apiKey") || "");
    const token = String(formData.get("token") || "");
    const autoDispatch = formData.get("autoDispatch") === "on";
    const insuranceEnabled = formData.get("insuranceEnabled") === "on";
    const defaultServiceType = String(formData.get("defaultServiceType") || "standard");

    await updateShippingConfig(session.tenantId, storeId, {
      defaultProvider,
      credentials: { apiKey, token },
      settings: {
        autoDispatch,
        requireManualApproval: !autoDispatch,
        defaultServiceType,
        insuranceEnabled,
      },
    });

    await logAudit({ tenantId: session.tenantId, userId: session.sub, action: "update", resource: "store_shipping_config", resourceId: storeId });
    revalidatePath(`/dashboard/stores/${storeId}`);
    return { success: "تم تحديث إعدادات الشحن" };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "حدث خطأ" };
  }
}

export async function updateNotificationConfigAction(storeId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  try {
    await requirePermission(session, Permission.STORE_UPDATE);

    const whatsappEnabled = formData.get("whatsappEnabled") === "on";
    const smsEnabled = formData.get("smsEnabled") === "on";
    const emailEnabled = formData.get("emailEnabled") === "on";

    await updateNotificationConfig(session.tenantId, storeId, {
      whatsapp: { enabled: whatsappEnabled, apiKey: String(formData.get("whatsappApiKey") || ""), apiUrl: String(formData.get("whatsappApiUrl") || "") },
      sms: { enabled: smsEnabled, apiKey: String(formData.get("smsApiKey") || ""), senderId: String(formData.get("smsSenderId") || "") },
      email: { enabled: emailEnabled, from: String(formData.get("emailFrom") || "") },
    });

    await logAudit({ tenantId: session.tenantId, userId: session.sub, action: "update", resource: "store_notification_config", resourceId: storeId });
    revalidatePath(`/dashboard/stores/${storeId}`);
    return { success: "تم تحديث إعدادات الإشعارات" };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "حدث خطأ" };
  }
}

export async function toggleStoreAction(storeId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await requirePermission(session, Permission.STORE_UPDATE);
  await toggleStoreActive(session.tenantId, storeId);
  await logAudit({ tenantId: session.tenantId, userId: session.sub, action: "toggle", resource: "store", resourceId: storeId });
  revalidatePath("/dashboard/stores");
}
