"use client";

import { useTransition } from "react";
import { removeMemberAction, updateRoleAction } from "./actions";

export function MemberActions({ memberId, role, canManage }: { memberId: string; role: string; canManage: boolean }) {
  const [pending, startTransition] = useTransition();
  if (!canManage || role === "owner") return <span className="text-xs text-slate-600">—</span>;

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={role}
        disabled={pending}
        onChange={(e) => startTransition(() => updateRoleAction(memberId, e.target.value))}
        className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-300 outline-none"
      >
        <option value="manager">مدير</option>
        <option value="operator">مشغل</option>
        <option value="viewer">مشاهد</option>
      </select>
      <button
        disabled={pending}
        onClick={() => startTransition(() => removeMemberAction(memberId))}
        className="rounded-lg bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
      >
        إزالة
      </button>
    </div>
  );
}
