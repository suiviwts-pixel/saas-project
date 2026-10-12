"use client";

import { useTransition } from "react";
import { toggleRuleAction, deleteRuleAction } from "./actions";

export function RuleActions({ ruleId, isActive, canManage }: { ruleId: string; isActive: boolean; canManage: boolean }) {
  const [pending, startTransition] = useTransition();
  if (!canManage) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={pending}
        onClick={() => startTransition(() => toggleRuleAction(ruleId))}
        className={`rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${isActive ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25" : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"}`}
      >
        {isActive ? "إيقاف" : "تفعيل"}
      </button>
      <button
        disabled={pending}
        onClick={() => startTransition(() => deleteRuleAction(ruleId))}
        className="rounded-lg bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
      >
        حذف
      </button>
    </div>
  );
}
