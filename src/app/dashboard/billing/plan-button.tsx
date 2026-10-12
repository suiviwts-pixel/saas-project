"use client";

import { useTransition } from "react";
import { upgradePlanAction } from "./actions";
import type { PlanType } from "@/lib/billing";

export function PlanButton({ plan, isCurrent, canManage }: { plan: PlanType; isCurrent: boolean; canManage: boolean }) {
  const [pending, startTransition] = useTransition();

  if (isCurrent) {
    return <button disabled className="mt-4 w-full rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-slate-400">خطتك الحالية</button>;
  }
  if (!canManage) return null;

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => upgradePlanAction(plan))}
      className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "جاري التبديل..." : "اختر هذه الخطة"}
    </button>
  );
}
