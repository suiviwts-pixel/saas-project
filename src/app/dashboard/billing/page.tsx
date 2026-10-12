import { getSession } from "@/lib/auth";
import { getUsageStats, PLAN_LIMITS, type PlanType } from "@/lib/billing";
import { hasPermission, Permission } from "@/lib/permissions";
import { PlanButton } from "./plan-button";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await getSession();
  if (!session) return null;

  const [usage, canManage] = await Promise.all([
    getUsageStats(session.tenantId),
    hasPermission(session, Permission.BILLING_MANAGE),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">الفوترة والاشتراك</h1>
        <p className="mt-1 text-sm text-slate-400">تابع استخدامك الحالي وقم بترقية خطتك عند الحاجة.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">الخطة الحالية</p>
            <p className="text-2xl font-bold text-white">{usage.label}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">تاريخ التجديد</p>
            <p className="font-semibold text-slate-200">{new Date(usage.renewsAt).toLocaleDateString("ar-DZ")}</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-sm text-slate-400">
            <span>الطلبات المستخدمة هذا الشهر</span>
            <span>{usage.ordersUsed} / {usage.ordersLimit === Infinity ? "∞" : usage.ordersLimit}</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${usage.usagePercentage > 85 ? "bg-red-500" : "bg-gradient-to-r from-indigo-500 to-cyan-400"}`}
              style={{ width: `${usage.usagePercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {(Object.entries(PLAN_LIMITS) as [PlanType, (typeof PLAN_LIMITS)[PlanType]][]).map(([key, plan]) => (
          <div key={key} className={`rounded-2xl border p-6 ${key === usage.plan ? "border-indigo-400 bg-indigo-500/10" : "border-white/10 bg-white/5"}`}>
            <h3 className="font-bold text-white">{plan.label}</h3>
            <p className="mt-2 text-2xl font-black text-white">
              {plan.priceDZD === 0 ? "مجانًا" : `${plan.priceDZD.toLocaleString()} دج`}
              {plan.priceDZD > 0 ? <span className="text-sm font-normal text-slate-400">/شهر</span> : null}
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
              <li>📦 {plan.ordersPerMonth === Infinity ? "غير محدود" : `${plan.ordersPerMonth.toLocaleString()} طلب/شهر`}</li>
              <li>🏬 {plan.stores === Infinity ? "غير محدود" : `${plan.stores} متجر`}</li>
              <li>👥 {plan.teamMembers === Infinity ? "غير محدود" : `${plan.teamMembers} أعضاء`}</li>
              <li>⚙️ {plan.automationRules === Infinity ? "غير محدود" : `${plan.automationRules} قاعدة أتمتة`}</li>
            </ul>
            <PlanButton plan={key} isCurrent={key === usage.plan} canManage={canManage} />
          </div>
        ))}
      </div>
    </div>
  );
}
