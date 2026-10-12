"use client";

import { useTransition } from "react";
import { dispatchOrderAction, updateStatusAction } from "./actions";

const STATUS_OPTIONS = [
  { value: "pending", label: "قيد الانتظار" },
  { value: "processing", label: "قيد المعالجة" },
  { value: "confirmed", label: "مؤكد" },
  { value: "shipped", label: "تم الشحن" },
  { value: "in_transit", label: "في الطريق" },
  { value: "out_for_delivery", label: "خارج للتوصيل" },
  { value: "delivered", label: "تم التسليم" },
  { value: "failed", label: "فشل" },
  { value: "returned", label: "مرتجع" },
  { value: "cancelled", label: "ملغى" },
];

export function OrderRowActions({ orderId, canDispatch, canUpdate, hasTracking }: { orderId: string; canDispatch: boolean; canUpdate: boolean; hasTracking: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      {canDispatch && !hasTracking ? (
        <button
          disabled={pending}
          onClick={() => startTransition(() => dispatchOrderAction(orderId))}
          className="rounded-lg bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25 disabled:opacity-50"
        >
          🚚 إرسال للشحن
        </button>
      ) : null}
      {canUpdate ? (
        <select
          disabled={pending}
          defaultValue=""
          onChange={(e) => {
            if (!e.target.value) return;
            const status = e.target.value;
            startTransition(() => updateStatusAction(orderId, status));
            e.target.value = "";
          }}
          className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-300 outline-none"
        >
          <option value="">تغيير الحالة</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
