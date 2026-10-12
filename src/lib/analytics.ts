import { db } from "@/db";
import { orders } from "@/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";

export async function getDashboardStats(tenantId: string, days = 30) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const [row] = await db
    .select({
      totalOrders: sql<number>`count(*)::int`,
      delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')::int`,
      failed: sql<number>`count(*) filter (where ${orders.status} = 'failed')::int`,
      inTransit: sql<number>`count(*) filter (where ${orders.status} in ('shipped', 'in_transit', 'out_for_delivery'))::int`,
      pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')::int`,
      totalRevenue: sql<number>`coalesce(sum(${orders.totalPrice}::numeric), 0)::float`,
      avgOrderValue: sql<number>`coalesce(avg(${orders.totalPrice}::numeric), 0)::float`,
    })
    .from(orders)
    .where(and(eq(orders.tenantId, tenantId), gte(orders.createdAt, fromDate)));

  return (
    row || {
      totalOrders: 0,
      delivered: 0,
      failed: 0,
      inTransit: 0,
      pending: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
    }
  );
}

export async function getProviderPerformance(tenantId: string) {
  return db
    .select({
      provider: orders.shippingProvider,
      total: sql<number>`count(*)::int`,
      delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')::int`,
      failed: sql<number>`count(*) filter (where ${orders.status} = 'failed')::int`,
      inTransit: sql<number>`count(*) filter (where ${orders.status} in ('shipped','in_transit'))::int`,
      totalRevenue: sql<number>`coalesce(sum(${orders.totalPrice}::numeric), 0)::float`,
    })
    .from(orders)
    .where(and(eq(orders.tenantId, tenantId), sql`${orders.shippingProvider} is not null`))
    .groupBy(orders.shippingProvider)
    .orderBy(desc(sql`count(*)`));
}

export async function getWilayaStats(tenantId: string, limit = 15) {
  return db
    .select({
      wilaya: sql<string>`${orders.customer}->>'wilaya'`,
      total: sql<number>`count(*)::int`,
      delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')::int`,
      failed: sql<number>`count(*) filter (where ${orders.status} = 'failed')::int`,
      revenue: sql<number>`coalesce(sum(${orders.totalPrice}::numeric), 0)::float`,
    })
    .from(orders)
    .where(eq(orders.tenantId, tenantId))
    .groupBy(sql`${orders.customer}->>'wilaya'`)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

export async function getDailyOrders(tenantId: string, days = 14) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  return db
    .select({
      day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
      total: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${orders.totalPrice}::numeric), 0)::float`,
    })
    .from(orders)
    .where(and(eq(orders.tenantId, tenantId), gte(orders.createdAt, fromDate)))
    .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);
}

export async function getRecentOrders(tenantId: string, limit = 8) {
  return db
    .select()
    .from(orders)
    .where(eq(orders.tenantId, tenantId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}
