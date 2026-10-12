import { getSession } from "@/lib/auth";
import { findOrderById } from "@/lib/orders";
import { getStoreById } from "@/lib/stores";
import { hasPermission, Permission } from "@/lib/permissions";
import { OrderRowActions } from "../order-row-actions";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار", processing: "قيد المعالجة", confirmed: "مؤكد", shipped: "تم الشحن",
  in_transit: "في الطريق", out_for_delivery: "خارج للتوصيل", delivered: "تم التسليم",
  failed: "فشل", returned: "مرتجع", cancelled: "ملغى",
};

function money(n: number) {
  return `${Math.round(n).toLocaleString()} دج`;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  let order;
  try {
    order = await findOrderById(session.tenantId, id);
  } catch {
    notFound();
  }

  const [store, canDispatch, canUpdate] = await Promise.all([
    getStoreById(session.tenantId, order.storeId).catch(() => null),
    hasPermission(session, Permission.ORDER_DISPATCH),
    hasPermission(session, Permission.ORDER_UPDATE),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">طلب {order.externalOrderNumber}</h1>
          <p className="mt-1 text-sm text-slate-400">من متجر {store?.name ?? "—"}</p>
        </div>
        <span className="rounded-full bg-indigo-500/15 px-3 py-1.5 text-sm font-semibold text-indigo-300">{STATUS_LABELS[order.status]}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-2">
          <h2 className="mb-4 font-bold text-white">المنتجات</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-right text-xs text-slate-400">
                <th className="pb-2">المنتج</th>
                <th className="pb-2">الكمية</th>
                <th className="pb-2">السعر</th>
                <th className="pb-2">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx} className="border-b border-white/5">
                  <td className="py-2 text-slate-200">{item.name}</td>
                  <td className="py-2 text-slate-400">{item.quantity}</td>
                  <td className="py-2 text-slate-400">{money(item.price)}</td>
                  <td className="py-2 text-slate-300">{money(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 space-y-1 border-t border-white/10 pt-4 text-sm">
            <div className="flex justify-between text-slate-400"><span>المجموع الفرعي</span><span>{money(Number(order.subtotal))}</span></div>
            <div className="flex justify-between text-slate-400"><span>الشحن</span><span>{money(Number(order.shippingCost))}</span></div>
            <div className="flex justify-between text-slate-400"><span>الضريبة</span><span>{money(Number(order.taxAmount))}</span></div>
            <div className="flex justify-between text-slate-400"><span>الخصم</span><span>-{money(Number(order.discountAmount))}</span></div>
            <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white"><span>الإجمالي</span><span>{money(Number(order.totalPrice))}</span></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-3 font-bold text-white">معلومات العميل</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">الاسم</dt><dd className="text-slate-200">{order.customer.firstName} {order.customer.lastName}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">الهاتف</dt><dd dir="ltr" className="text-slate-200">{order.customer.phone}</dd></div>
              {order.customer.email ? <div className="flex justify-between"><dt className="text-slate-400">البريد</dt><dd className="text-slate-200">{order.customer.email}</dd></div> : null}
              <div className="flex justify-between"><dt className="text-slate-400">الولاية</dt><dd className="text-slate-200">{order.customer.wilaya}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">البلدية</dt><dd className="text-slate-200">{order.customer.city}</dd></div>
              <div><dt className="text-slate-400">العنوان</dt><dd className="mt-1 text-slate-200">{order.customer.address}</dd></div>
            </dl>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-3 font-bold text-white">الشحن</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">شركة الشحن</dt><dd className="text-slate-200">{order.shippingProvider || "لم يُحدد بعد"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">رقم التتبع</dt><dd dir="ltr" className="text-slate-200">{order.trackingNumber || "—"}</dd></div>
              {order.lastError ? <p className="rounded-lg bg-red-500/10 px-2 py-1.5 text-xs text-red-300">خطأ: {order.lastError}</p> : null}
            </dl>
            <div className="mt-4">
              <OrderRowActions orderId={order.id} canDispatch={canDispatch} canUpdate={canUpdate} hasTracking={!!order.trackingNumber} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
