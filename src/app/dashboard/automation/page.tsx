import { getSession } from "@/lib/auth";
import { listAutomationRules } from "@/lib/automation-rules";
import { listStores } from "@/lib/stores";
import { hasPermission, Permission } from "@/lib/permissions";
import { RuleForm } from "./rule-form";
import { RuleActions } from "./rule-actions";
import { db } from "@/db";
import { notificationLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const EVENT_LABELS: Record<string, string> = {
  "order.created": "عند إنشاء الطلب", "order.confirmed": "عند تأكيد الطلب", "order.shipped": "عند شحن الطلب",
  "order.delivered": "عند تسليم الطلب", "order.failed": "عند فشل التوصيل", "order.returned": "عند إرجاع الطلب",
  "order.cancelled": "عند إلغاء الطلب", "tracking.updated": "عند تحديث التتبع",
};

const ACTION_LABELS: Record<string, string> = {
  send_whatsapp: "واتساب", send_sms: "SMS", send_email: "بريد إلكتروني", notify_admin: "تنبيه المسؤول",
  update_status: "تحديث الحالة", assign_provider: "تعيين شركة شحن", webhook_outgoing: "Webhook خارجي", cancel_order: "إلغاء الطلب",
};

export default async function AutomationPage() {
  const session = await getSession();
  if (!session) return null;

  const [rules, stores, canManage, logs] = await Promise.all([
    listAutomationRules(session.tenantId),
    listStores(session.tenantId),
    hasPermission(session, Permission.AUTOMATION_MANAGE),
    db.select().from(notificationLogs).where(eq(notificationLogs.tenantId, session.tenantId)).orderBy(desc(notificationLogs.createdAt)).limit(10),
  ]);

  const storeNames = Object.fromEntries(stores.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">محرك الأتمتة</h1>
          <p className="mt-1 text-sm text-slate-400">أنشئ قواعد تلقائية تُنفَّذ عند وقوع أحداث معينة على الطلبات.</p>
        </div>
        {canManage ? <RuleForm stores={stores.map((s) => ({ id: s.id, name: s.name }))} /> : null}
      </div>

      <div className="grid gap-4">
        {rules.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد قواعد أتمتة بعد.</p>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white">{rule.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${rule.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-400"}`}>
                      {rule.isActive ? "مفعلة" : "متوقفة"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{storeNames[rule.storeId] || "—"} · أولوية {rule.priority}</p>
                </div>
                <RuleActions ruleId={rule.id} isActive={rule.isActive} canManage={canManage} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-indigo-500/15 px-2.5 py-1 font-semibold text-indigo-300">{EVENT_LABELS[rule.triggerEvent]}</span>
                <span className="rounded-full bg-cyan-500/15 px-2.5 py-1 font-semibold text-cyan-300">→ {ACTION_LABELS[rule.actionType]}</span>
                {rule.triggerConditions?.wilaya?.length ? (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 font-semibold text-slate-300">الولايات: {rule.triggerConditions.wilaya.join(", ")}</span>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-slate-500">نُفذت {rule.executionCount} مرة{rule.lastExecutedAt ? ` · آخر تنفيذ ${new Date(rule.lastExecutedAt).toLocaleString("ar-DZ")}` : ""}</p>
            </div>
          ))
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-4 font-bold text-white">سجل الإشعارات الأخير</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">لم يتم إرسال أي إشعارات بعد.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs">
                <span className="font-semibold text-slate-300">{log.channel} → {log.recipient}</span>
                <span className="text-slate-500">{log.message.slice(0, 60)}</span>
                <span className={`rounded-full px-2 py-0.5 font-semibold ${log.status === "sent" ? "bg-emerald-500/15 text-emerald-300" : log.status === "failed" ? "bg-red-500/15 text-red-300" : "bg-slate-500/15 text-slate-400"}`}>
                  {log.status === "sent" ? "أُرسل" : log.status === "failed" ? "فشل" : "محاكاة"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
