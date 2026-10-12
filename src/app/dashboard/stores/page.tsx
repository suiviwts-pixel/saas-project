import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listStores } from "@/lib/stores";
import { hasPermission, Permission } from "@/lib/permissions";
import { CreateStoreForm } from "./store-form";
import { ToggleStoreButton } from "./toggle-button";

export const dynamic = "force-dynamic";

const PLATFORM_LABELS: Record<string, string> = {
  shopify: "Shopify",
  salla: "Salla",
  woocommerce: "WooCommerce",
  custom: "مخصص",
};

export default async function StoresPage() {
  const session = await getSession();
  if (!session) return null;

  const [stores, canCreate, canUpdate] = await Promise.all([
    listStores(session.tenantId),
    hasPermission(session, Permission.STORE_CREATE),
    hasPermission(session, Permission.STORE_UPDATE),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">المتاجر</h1>
        <p className="mt-1 text-sm text-slate-400">أدر متاجرك المرتبطة ونقاط webhook الخاصة بكل منصة.</p>
      </div>

      {canCreate ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <CreateStoreForm />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {stores.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد متاجر بعد. أنشئ متجرك الأول أعلاه.</p>
        ) : (
          stores.map((store) => (
            <div key={store.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white">{store.name}</h3>
                  <span className="mt-1 inline-block rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-300">
                    {PLATFORM_LABELS[store.platform]}
                  </span>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${store.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-400"}`}>
                  {store.isActive ? "نشط" : "معطل"}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">شركة الشحن الافتراضية: <span className="text-slate-300">{store.shippingConfig.defaultProvider}</span></p>
              <p className="mt-1 text-xs text-slate-500">الإرسال التلقائي: <span className="text-slate-300">{store.shippingConfig.settings.autoDispatch ? "مفعل" : "معطل"}</span></p>
              <div className="mt-4 flex items-center gap-2">
                <Link href={`/dashboard/stores/${store.id}`} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20">
                  الإعدادات
                </Link>
                {canUpdate ? <ToggleStoreButton storeId={store.id} isActive={store.isActive} /> : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
