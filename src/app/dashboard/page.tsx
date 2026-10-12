import { getSession } from "@/lib/auth";
import { getDashboardStats, getProviderPerformance, getWilayaStats, getRecentOrders } from "@/lib/analytics";
import { getUsageStats } from "@/lib/billing";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  processing: "قيد المعالجة",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  in_transit: "في الطريق",
  out_for_delivery: "خارج للتوصيل",
  delivered: "تم التسليم",
  failed: "فشل",
  returned: "مرتجع",
  cancelled: "ملغى",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-500/20 text-slate-300",
  processing: "bg-amber-500/20 text-amber-300",
  confirmed: "bg-blue-500/20 text-blue-300",
  shipped: "bg-cyan-500/20 text-cyan-300",
  in_transit: "bg-cyan-500/20 text-cyan-300",
  out_for_delivery: "bg-purple-500/20 text-purple-300",
  delivered: "bg-emerald-500/20 text-emerald-300",
  failed: "bg-red-500/20 text-red-300",
  returned: "bg-orange-500/20 text-orange-300",
  cancelled: "bg-slate-500/20 text-slate-400",
};

function money(n: number) {
  return `${Math.round(n).toLocaleString()} دج`;
}

export default async function DashboardOverviewPage() {
  const session = await getSession();
  if (!session) return null;

  const [stats, providers, wilayas, recentOrders, usage] = await Promise.all([
    getDashboardStats(session.tenantId),
    getProviderPerformance(session.tenantId),
    getWilayaStats(session.tenantId, 8),
    getRecentOrders(session.tenantId, 8),
    getUsageStats(session.tenantId),
  ]);

  const cards = [
    { label: "إجمالي الطلبات (30 يوم)", value: stats.totalOrders.toLocaleString(), icon: "📦", color: "from-indigo-500 to-indigo-400" },
    { label: "تم التسليم", value: stats.delivered.toLocaleString(), icon: "✅", color: "from-emerald-500 to-emerald-400" },
    { label: "في الطريق", value: stats.inTransit.toLocaleString(), icon: "🚚", color: "from-cyan-500 to-cyan-400" },
    { label: "فشل/مرتجع", value: stats.failed.toLocaleString(), icon: "⚠️", color: "from-red-500 to-red-400" },
    { label: "إجمالي الإيرادات", value: money(stats.totalRevenue), icon: "💰", color: "from-amber-500 to-amber-400" },
    { label: "متوسط قيمة الطلب", value: money(stats.avgOrderValue), icon: "📈", color: "from-purple-500 to-purple-400" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">نظرة عامة</h1>
          <p className="mt-1 text-sm text-slate-400">أهلاً {session.fullName}، إليك ملخص أداء أعمالك.</p>
        </div>
        <Link href="/dashboard/orders" className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:opacity-90">
          + طلب جديد
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-white">خطة {usage.label}</span>
          <span className="text-slate-400">{usage.ordersUsed} / {usage.ordersLimit === Infinity ? "∞" : usage.ordersLimit} طلب هذا الشهر</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${usage.usagePercentage}%` }} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-lg`}>
              {card.icon}
            </div>
            <p className="text-xl font-bold text-white">{card.value}</p>
            <p className="mt-1 text-xs text-slate-400">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 font-bold text-white">أداء شركات التوصيل</h2>
          {providers.length === 0 ? (
            <p className="text-sm text-slate-500">لا توجد بيانات شحن بعد.</p>
          ) : (
            <div className="space-y-3">
              {providers.map((p) => (
                <div key={p.provider} className="rounded-xl border border-white/10 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold capitalize text-white">{p.provider}</span>
                    <span className="text-xs text-slate-400">{p.total} طلب</span>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-slate-400">
                    <span className="text-emerald-400">✓ {p.delivered} مسلّم</span>
                    <span className="text-cyan-400">↻ {p.inTransit} بالطريق</span>
                    <span className="text-red-400">✕ {p.failed} فاشل</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 font-bold text-white">أعلى الولايات طلبًا</h2>
          {wilayas.length === 0 ? (
            <p className="text-sm text-slate-500">لا توجد بيانات بعد.</p>
          ) : (
            <div className="space-y-2">
              {wilayas.map((w) => (
                <div key={w.wilaya} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm">
                  <span className="text-slate-200">{w.wilaya || "غير محدد"}</span>
                  <span className="text-slate-400">{w.total} طلب · {money(w.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-white">أحدث الطلبات</h2>
          <Link href="/dashboard/orders" className="text-sm font-semibold text-indigo-300 hover:text-indigo-200">عرض الكل ←</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد طلبات بعد. أنشئ متجرًا وابدأ باستقبال الطلبات.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-right text-xs text-slate-400">
                  <th className="pb-2 font-medium">رقم الطلب</th>
                  <th className="pb-2 font-medium">العميل</th>
                  <th className="pb-2 font-medium">الولاية</th>
                  <th className="pb-2 font-medium">المبلغ</th>
                  <th className="pb-2 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5">
                    <td className="py-2.5">
                      <Link href={`/dashboard/orders/${order.id}`} className="font-semibold text-indigo-300 hover:underline">
                        {order.externalOrderNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 text-slate-300">{order.customer.firstName} {order.customer.lastName}</td>
                    <td className="py-2.5 text-slate-400">{order.customer.wilaya}</td>
                    <td className="py-2.5 text-slate-300">{money(Number(order.totalPrice))}</td>
                    <td className="py-2.5">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
