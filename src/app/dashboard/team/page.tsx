import { getSession } from "@/lib/auth";
import { listTeamMembers } from "@/lib/team";
import { hasPermission, Permission, ROLE_LABELS } from "@/lib/permissions";
import { InviteMemberForm } from "./team-form";
import { MemberActions } from "./member-actions";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await getSession();
  if (!session) return null;

  const [members, canInvite, canRemove] = await Promise.all([
    listTeamMembers(session.tenantId),
    hasPermission(session, Permission.TEAM_INVITE),
    hasPermission(session, Permission.TEAM_REMOVE),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">إدارة الفريق</h1>
        <p className="mt-1 text-sm text-slate-400">تحكم في صلاحيات أعضاء فريقك حسب دور كل منهم (RBAC).</p>
      </div>

      {canInvite ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <InviteMemberForm />
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-right text-xs text-slate-400">
              <th className="px-4 py-3 font-medium">الاسم</th>
              <th className="px-4 py-3 font-medium">البريد الإلكتروني</th>
              <th className="px-4 py-3 font-medium">الدور</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 text-slate-200">{member.fullName}</td>
                <td className="px-4 py-3 text-slate-400" dir="ltr">{member.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-semibold text-indigo-300">
                    {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${member.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-400"}`}>
                    {member.isActive ? "نشط" : "معطل"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <MemberActions memberId={member.id} role={member.role} canManage={canRemove} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
        <h3 className="mb-2 font-bold text-white">الصلاحيات حسب الدور</h3>
        <ul className="space-y-1">
          <li><span className="font-semibold text-indigo-300">مالك:</span> جميع الصلاحيات دون استثناء.</li>
          <li><span className="font-semibold text-indigo-300">مدير:</span> إدارة الطلبات، المتاجر، الفريق، الأتمتة والتقارير.</li>
          <li><span className="font-semibold text-indigo-300">مشغل:</span> إنشاء ومتابعة الطلبات وإرسالها للشحن فقط.</li>
          <li><span className="font-semibold text-indigo-300">مشاهد:</span> عرض الطلبات والتقارير دون صلاحية التعديل.</li>
        </ul>
      </div>
    </div>
  );
}
