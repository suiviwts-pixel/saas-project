import {
  pgTable,
  pgEnum,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";

const id = () =>
  varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID());

// ────────────────────────────────────────────────────────────────────────────
// Enums
// ────────────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "store_owner",
  "manager",
  "operator",
  "viewer",
]);

export const teamRoleEnum = pgEnum("team_role", [
  "owner",
  "manager",
  "operator",
  "viewer",
]);

export const storePlatformEnum = pgEnum("store_platform", [
  "shopify",
  "salla",
  "woocommerce",
  "custom",
]);

export const shippingProviderEnum = pgEnum("shipping_provider_type", [
  "zrexpress",
  "yalidine",
  "maystro",
  "custom",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "confirmed",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed",
  "returned",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cod",
  "online",
  "bank_transfer",
]);

export const planTypeEnum = pgEnum("plan_type", [
  "free",
  "starter",
  "pro",
  "business",
  "enterprise",
]);

export const automationEventEnum = pgEnum("automation_event", [
  "order.created",
  "order.confirmed",
  "order.shipped",
  "order.delivered",
  "order.failed",
  "order.returned",
  "order.cancelled",
  "tracking.updated",
]);

export const automationActionEnum = pgEnum("automation_action", [
  "send_whatsapp",
  "send_sms",
  "send_email",
  "update_status",
  "assign_provider",
  "notify_admin",
  "webhook_outgoing",
  "cancel_order",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "whatsapp",
  "sms",
  "email",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "sent",
  "simulated",
  "failed",
]);

// ────────────────────────────────────────────────────────────────────────────
// Tenants & Users
// ────────────────────────────────────────────────────────────────────────────

export const tenants = pgTable("tenants", {
  id: id(),
  name: text("name").notNull(),
  ownerId: varchar("owner_id", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: id(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default("store_owner"),
  isActive: boolean("is_active").notNull().default(true),
  emailVerified: boolean("email_verified").notNull().default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
}));

// ────────────────────────────────────────────────────────────────────────────
// Team members (RBAC) — scoped per tenant, applies across all tenant stores
// ────────────────────────────────────────────────────────────────────────────

export const teamMembers = pgTable("team_members", {
  id: id(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  role: teamRoleEnum("role").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  invitedBy: varchar("invited_by", { length: 36 }),
  invitedAt: timestamp("invited_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  customPermissions: jsonb("custom_permissions").$type<string[]>().notNull().default([]),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tenantUserIdx: uniqueIndex("team_members_tenant_user_idx").on(table.tenantId, table.userId),
  userIdx: index("team_members_user_idx").on(table.userId),
}));

// ────────────────────────────────────────────────────────────────────────────
// Stores
// ────────────────────────────────────────────────────────────────────────────

export type PlatformCredentials = {
  apiKey?: string;
  apiSecret?: string;
  webhookSecret?: string;
  storeUrl?: string;
};

export type ShippingConfig = {
  defaultProvider: "zrexpress" | "yalidine" | "maystro" | "custom";
  fallbackProvider?: "zrexpress" | "yalidine" | "maystro" | "custom";
  credentials: {
    apiKey?: string;
    token?: string;
    secretKey?: string;
    warehouseId?: string;
  };
  settings: {
    autoDispatch: boolean;
    requireManualApproval: boolean;
    defaultServiceType: string;
    insuranceEnabled: boolean;
  };
};

export type NotificationConfig = {
  whatsapp?: { enabled: boolean; apiKey?: string; apiUrl?: string; sessionId?: string };
  sms?: { enabled: boolean; apiKey?: string; apiUrl?: string; senderId?: string };
  email?: { enabled: boolean; host?: string; port?: number; user?: string; pass?: string; from?: string };
};

export const stores = pgTable("stores", {
  id: id(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  name: text("name").notNull(),
  ownerId: varchar("owner_id", { length: 36 }).notNull(),
  platform: storePlatformEnum("platform").notNull().default("custom"),
  slug: varchar("slug", { length: 160 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  platformCredentials: jsonb("platform_credentials").$type<PlatformCredentials>().notNull().default({}),
  shippingConfig: jsonb("shipping_config").$type<ShippingConfig>().notNull().default({
    defaultProvider: "zrexpress",
    credentials: {},
    settings: {
      autoDispatch: false,
      requireManualApproval: false,
      defaultServiceType: "standard",
      insuranceEnabled: false,
    },
  }),
  notificationConfig: jsonb("notification_config").$type<NotificationConfig>().notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("stores_slug_idx").on(table.slug),
  tenantIdx: index("stores_tenant_idx").on(table.tenantId, table.isActive),
}));

// ────────────────────────────────────────────────────────────────────────────
// Orders
// ────────────────────────────────────────────────────────────────────────────

export type OrderCustomer = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  wilaya: string;
  postalCode?: string;
  country: string;
};

export type OrderItem = {
  productId?: string;
  sku?: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
};

export const orders = pgTable("orders", {
  id: id(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  storeId: varchar("store_id", { length: 36 }).notNull(),
  externalOrderId: text("external_order_id").notNull(),
  externalOrderNumber: text("external_order_number").notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  customer: jsonb("customer").$type<OrderCustomer>().notNull(),
  items: jsonb("items").$type<OrderItem[]>().notNull().default([]),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull().default("0"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("cod"),
  isPaid: boolean("is_paid").notNull().default(false),
  shippingStatus: orderStatusEnum("shipping_status").notNull().default("pending"),
  shippingProvider: text("shipping_provider"),
  trackingNumber: text("tracking_number"),
  shippingLabelUrl: text("shipping_label_url"),
  dispatchedAt: timestamp("dispatched_at"),
  deliveredAt: timestamp("delivered_at"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 36 }),
  updatedBy: varchar("updated_by", { length: 36 }),
  lastSyncAt: timestamp("last_sync_at"),
  retryCount: integer("retry_count").notNull().default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  externalOrderStoreIdx: uniqueIndex("orders_external_store_idx").on(table.externalOrderId, table.storeId),
  tenantStatusIdx: index("orders_tenant_status_idx").on(table.tenantId, table.status),
  tenantStoreIdx: index("orders_tenant_store_idx").on(table.tenantId, table.storeId),
  trackingIdx: index("orders_tracking_idx").on(table.trackingNumber),
}));

// ────────────────────────────────────────────────────────────────────────────
// Subscriptions / Billing
// ────────────────────────────────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id: id(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  plan: planTypeEnum("plan").notNull().default("free"),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  ordersThisMonth: integer("orders_this_month").notNull().default(0),
  apiCallsToday: integer("api_calls_today").notNull().default(0),
  currentPeriodStart: timestamp("current_period_start").defaultNow().notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  trialEndsAt: timestamp("trial_ends_at"),
  totalPaid: numeric("total_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 8 }).notNull().default("DZD"),
  lastBillingDate: timestamp("last_billing_date"),
  nextBillingDate: timestamp("next_billing_date"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
}, (table) => ({
  tenantIdx: uniqueIndex("subscriptions_tenant_idx").on(table.tenantId),
}));

// ────────────────────────────────────────────────────────────────────────────
// Automation Rules
// ────────────────────────────────────────────────────────────────────────────

export type AutomationConditions = {
  wilaya?: string[];
  paymentMethod?: string[];
  totalPriceMin?: number;
  totalPriceMax?: number;
  shippingProvider?: string[];
};

export const automationRules = pgTable("automation_rules", {
  id: id(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  storeId: varchar("store_id", { length: 36 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  priority: integer("priority").notNull().default(0),
  triggerEvent: automationEventEnum("trigger_event").notNull(),
  triggerConditions: jsonb("trigger_conditions").$type<AutomationConditions>().notNull().default({}),
  actionType: automationActionEnum("action_type").notNull(),
  actionConfig: jsonb("action_config").$type<Record<string, any>>().notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
  executionCount: integer("execution_count").notNull().default(0),
  lastExecutedAt: timestamp("last_executed_at"),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tenantStoreIdx: index("automation_rules_tenant_store_idx").on(table.tenantId, table.storeId, table.isActive),
  eventIdx: index("automation_rules_event_idx").on(table.triggerEvent, table.isActive),
}));

// ────────────────────────────────────────────────────────────────────────────
// Audit Logs
// ────────────────────────────────────────────────────────────────────────────

export const auditLogs = pgTable("audit_logs", {
  id: id(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  changes: jsonb("changes").$type<Record<string, unknown>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("audit_logs_tenant_idx").on(table.tenantId, table.createdAt),
}));

// ────────────────────────────────────────────────────────────────────────────
// Notification Logs
// ────────────────────────────────────────────────────────────────────────────

export const notificationLogs = pgTable("notification_logs", {
  id: id(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  storeId: varchar("store_id", { length: 36 }),
  orderId: varchar("order_id", { length: 36 }),
  channel: notificationChannelEnum("channel").notNull(),
  recipient: text("recipient").notNull(),
  message: text("message").notNull(),
  status: notificationStatusEnum("status").notNull(),
  providerMessageId: text("provider_message_id"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("notification_logs_tenant_idx").on(table.tenantId, table.createdAt),
}));
