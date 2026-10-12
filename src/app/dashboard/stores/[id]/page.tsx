import { getSession } from "@/lib/auth";
import { getStoreById } from "@/lib/stores";
import { headers } from "next/headers";
import { ShippingConfigForm } from "./shipping-form";
import { NotificationConfigForm } from "./notification-form";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  let store;
  try {
    store = await getStoreById(session.tenantId, id);
  } catch {
    notFound();
  }

  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "https";
  const origin = `${protocol}://${host}`;

  const webhookUrls = [
    { label: "Shopify", url: `${origin}/api/webhooks/shopify/${store.id}` },
    { label: "Salla", url: `${origin}/api/webhooks/salla/${store.id}` },
    { label: "WooCommerce", url: `${origin}/api/webhooks/woocommerce/${store.id}` },
    { label: "شركة الشحن (ZRExpress)", url: `${origin}/api/webhooks/shipping/zrexpress/${store.id}` },
    { label: "شركة الشحن (Yalidine)", url: `${origin}/api/webhooks/shipping/yalidine/${store.id}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{store.name}</h1>
        <p className="mt-1 text-sm text-slate-400">معرّف المتجر: <span dir="ltr" className="font-mono text-slate-300">{store.id}</span></p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 font-bold text-white">روابط Webhooks</h2>
        <p className="mb-4 text-xs text-slate-500">استخدم هذه الروابط في إعدادات متجرك أو شركة الشحن لاستقبال الأحداث تلقائيًا.</p>
        <div className="space-y-2">
          {webhookUrls.map((w) => (
            <div key={w.label} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2">
              <span className="text-xs font-semibold text-slate-400">{w.label}</span>
              <code dir="ltr" className="break-all text-xs text-cyan-300">{w.url}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-4 font-bold text-white">إعدادات الشحن</h2>
        <ShippingConfigForm storeId={store.id} config={store.shippingConfig} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-4 font-bold text-white">إعدادات الإشعارات</h2>
        <NotificationConfigForm storeId={store.id} config={store.notificationConfig} />
      </div>
    </div>
  );
}
