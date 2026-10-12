import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  login: "تسجيل دخول", register: "إنشاء حساب", create: "إنشاء", update: "تعديل", delete: "حذف",
  toggle: "تبديل الحالة", dispatch: "إرسال للشحن", update_status: "تحديث الحالة", invite: "دعوة عضو",
  remove: "إزالة عضو", update_role: "تحديث الدور", upgrade_plan: "ترقية الخطة",
};

const RESOURCE_LABELS: Record<string, string> = {
  tenant: "المستأجر", session: "الجلسة", store: "متجر", order: "طلب", automation_rule: "قاعدة أتمتة",
  team_member: "عضو فريق", subscription: "الاشتراك", store_shipping_config: "إعدادات شحن المتجر",
  store_notification_config: "إعدادات إشعارات المتجر",
};

export default async function AuditPage() {
  const session = await getSession();
  if (!session) return null;

  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      resource: auditLogs.resource,
      resourceId: auditLogs.resourceId,
      createdAt: auditLogs.createdAt,
      changes: auditLogs.changes,
      userName: users.fullName,
      userEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(eq(auditLogs.tenantId, session.tenantId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">سجل التدقيق</h1>
        <p className="mt-1 text-sm text-slate-400">تتبع كامل لكل الإجراءات الحساسة في حسابك.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-right text-xs text-slate-400">
              <th className="px-4 py-3 font-medium">التاريخ</th>
              <th className="px-4 py-3 font-medium">المستخدم</th>
              <th className="px-4 py-3 font-medium">الإجراء</th>
              <th className="px-4 py-3 font-medium">المورد</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">لا توجد سجلات بعد</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-slate-400">{new Date(log.createdAt).toLocaleString("ar-DZ")}</td>
                  <td className="px-4 py-3 text-slate-300">{log.userName || "النظام"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-semibold text-indigo-300">
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {RESOURCE_LABELS[log.resource] || log.resource}
                    {log.resourceId ? <span className="mr-1 font-mono text-xs text-slate-600"> #{log.resourceId.slice(0, 8)}</span> : null}
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
