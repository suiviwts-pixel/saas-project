import { db } from "@/db";
import { stores, type NotificationConfig, type ShippingConfig } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { encrypt } from "./encryption";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return `${base || "store"}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function listStores(tenantId: string) {
  return db.select().from(stores).where(eq(stores.tenantId, tenantId)).orderBy(desc(stores.createdAt));
}

export async function getStoreById(tenantId: string, storeId: string) {
  const [store] = await db
    .select()
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.tenantId, tenantId)))
    .limit(1);
  if (!store) throw new Error("Store not found");
  return store;
}

export async function createStore(params: {
  tenantId: string;
  ownerId: string;
  name: string;
  platform: "shopify" | "salla" | "woocommerce" | "custom";
  storeUrl?: string;
}) {
  const [store] = await db
    .insert(stores)
    .values({
      tenantId: params.tenantId,
      ownerId: params.ownerId,
      name: params.name,
      platform: params.platform,
      slug: slugify(params.name),
      platformCredentials: params.storeUrl ? { storeUrl: params.storeUrl } : {},
      shippingConfig: {
        defaultProvider: "zrexpress",
        credentials: {},
        settings: {
          autoDispatch: false,
          requireManualApproval: false,
          defaultServiceType: "standard",
          insuranceEnabled: false,
        },
      },
      notificationConfig: {},
    })
    .returning();
  return store;
}

export async function updateShippingConfig(tenantId: string, storeId: string, config: ShippingConfig) {
  const store = await getStoreById(tenantId, storeId);
  const encryptedConfig: ShippingConfig = {
    ...config,
    credentials: {
      apiKey: config.credentials.apiKey ? encrypt(config.credentials.apiKey) : store.shippingConfig.credentials.apiKey,
      token: config.credentials.token ? encrypt(config.credentials.token) : store.shippingConfig.credentials.token,
      secretKey: config.credentials.secretKey ? encrypt(config.credentials.secretKey) : store.shippingConfig.credentials.secretKey,
      warehouseId: config.credentials.warehouseId,
    },
  };
  const [updated] = await db
    .update(stores)
    .set({ shippingConfig: encryptedConfig, updatedAt: new Date() })
    .where(eq(stores.id, storeId))
    .returning();
  return updated;
}

export async function updateNotificationConfig(tenantId: string, storeId: string, config: NotificationConfig) {
  await getStoreById(tenantId, storeId);
  const [updated] = await db
    .update(stores)
    .set({ notificationConfig: config, updatedAt: new Date() })
    .where(eq(stores.id, storeId))
    .returning();
  return updated;
}

export async function toggleStoreActive(tenantId: string, storeId: string) {
  const store = await getStoreById(tenantId, storeId);
  const [updated] = await db
    .update(stores)
    .set({ isActive: !store.isActive, updatedAt: new Date() })
    .where(eq(stores.id, storeId))
    .returning();
  return updated;
}
