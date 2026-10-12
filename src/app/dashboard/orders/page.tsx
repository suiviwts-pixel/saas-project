import Link from "next/link";
import { getSession } from "@/lib/auth";
import { findAllOrders } from "@/lib/orders";
import { listStores } from "@/lib/stores";
import { hasPermission, Permission } from "@/lib/permissions";
import { CreateOrderForm } from "./order-form";
import { OrderRowActions } from "./order-row-actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار", processing: "قيد المعالجة", confirmed: "مؤكد", shipped: "تم الشحن",
  in_transit: "في الطريق", out_for_delivery: "خارج للتوصيل", delivered: "تم التسليم",
  failed: "فشل", returned: "مرتجع", cancelled: "ملغى",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-500/20 text-slate-300", processing: "bg-amber-500/20 text-amber-300",
  confirmed: "bg-blue-500/20 text-blue-300", shipped: "bg-cyan-500/20 text-cyan-300",
  in_transit: "bg-cyan-500/20 text-cyan-300", out_for_delivery: "bg-purple-500/20 text-purple-300",
  delivered: "bg-emerald-500/20 text-emerald-300", failed: "bg-red-500/20 text-red-300",
  returned: "bg-orange-500/20 text-orange-300", cancelled: "bg-slate-500/20 text-slate-400",
};

function money(n: number) {
  return `${Math.round(n).toLocaleString()} دج`;
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) return null;

  const [{ data: orders, total }, stores, canCreate, canDispatch, canUpdate] = await Promise.all([
    findAllOrders(session.tenantId, { status: params.status, search: params.search, storeId: params.storeId, page: Number(params.page) || 1 }),
    listStores(session.tenantId),
    hasPermission(session, Permission.ORDER_CREATE),
    hasPermission(session, Permission.ORDER_DISPATCH),
    hasPermission(session, Permission.ORDER_UPDATE),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">الطلبات</h1>
          <p className="mt-1 text-sm text-slate-400">{total} طلب إجمالاً</p>
        </div>
        {canCreate ? <CreateOrderForm stores={stores.map((s) => ({ id: s.id, name: s.name }))} /> : null}
      </div>

      <form className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <input
          name="search"
          defaultValue={params.search}
          placeholder="ابحث برقم الطلب، الهاتف أو رقم التتبع"
          className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none"
        />
        <select name="status" defaultValue={params.status || ""} className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none">
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select name="storeId" defaultValue={params.storeId || ""} className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none">
          <option value="">كل المتاجر</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button type="submit" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">تصفية</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-right text-xs text-slate-400">
              <th className="px-4 py-3 font-medium">رقم الطلب</th>
              <th className="px-4 py-3 font-medium">العميل</th>
              <th className="px-4 py-3 font-medium">الولاية</th>
              <th className="px-4 py-3 font-medium">المبلغ</th>
              <th className="px-4 py-3 font-medium">شركة الشحن</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">لا توجد طلبات مطابقة</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/orders/${order.id}`} className="font-semibold text-indigo-300 hover:underline">
                      {order.externalOrderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{order.customer.firstName} {order.customer.lastName}<br /><span className="text-xs text-slate-500" dir="ltr">{order.customer.phone}</span></td>
                  <td className="px-4 py-3 text-slate-400">{order.customer.wilaya}</td>
                  <td className="px-4 py-3 text-slate-300">{money(Number(order.totalPrice))}</td>
                  <td className="px-4 py-3 text-slate-400">{order.shippingProvider || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <OrderRowActions orderId={order.id} canDispatch={canDispatch} canUpdate={canUpdate} hasTracking={!!order.trackingNumber} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
