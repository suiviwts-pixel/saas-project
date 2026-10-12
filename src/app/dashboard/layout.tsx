import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPermissions, Permission, ROLE_LABELS, getTeamMembership } from "@/lib/permissions";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logoutAction } from "@/app/actions/auth";

const NAV_ITEMS: { href: string; label: string; icon: string; permission?: Permission }[] = [
  { href: "/dashboard", label: "نظرة عامة", icon: "📊" },
  { href: "/dashboard/orders", label: "الطلبات", icon: "📦", permission: Permission.ORDER_VIEW },
  { href: "/dashboard/stores", label: "المتاجر", icon: "🏬", permission: Permission.STORE_VIEW },
  { href: "/dashboard/automation", label: "الأتمتة", icon: "🤖", permission: Permission.AUTOMATION_VIEW },
  { href: "/dashboard/team", label: "الفريق", icon: "👥", permission: Permission.TEAM_VIEW },
  { href: "/dashboard/billing", label: "الفوترة", icon: "💳", permission: Permission.BILLING_VIEW },
  { href: "/dashboard/audit", label: "سجل التدقيق", icon: "🧾", permission: Permission.SETTINGS_VIEW },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [permissions, membership, [tenant]] = await Promise.all([
    getPermissions(session),
    getTeamMembership(session.tenantId, session.sub),
    db.select().from(tenants).where(eq(tenants.id, session.tenantId)).limit(1),
  ]);

  const visibleNav = NAV_ITEMS.filter((item) => !item.permission || permissions.includes(item.permission));
  const roleLabel = membership ? ROLE_LABELS[membership.role as keyof typeof ROLE_LABELS] : "—";

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden w-64 flex-col border-l border-white/10 bg-slate-900/60 p-5 lg:flex">
        <div className="mb-8 flex items-center gap-2 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 font-black text-white">H</div>
          <span className="text-lg font-bold text-white">Hanotify</span>
        </div>
        <nav className="flex-1 space-y-1">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="truncate text-sm font-semibold text-white">{tenant?.name ?? "—"}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{session.email}</p>
          <span className="mt-2 inline-block rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
            {roleLabel}
          </span>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="w-full rounded-lg border border-white/10 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5">
              تسجيل الخروج
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-slate-900/40 px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 font-black text-white text-sm">H</div>
            <span className="font-bold text-white">Hanotify</span>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300">
              خروج
            </button>
          </form>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-white/10 bg-slate-900/40 px-3 py-2 lg:hidden">
          {visibleNav.map((item) => (
            <Link key={item.href} href={item.href} className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5">
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
