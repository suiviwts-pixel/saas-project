"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createRuleAction } from "./actions";

type Store = { id: string; name: string };

const EVENTS = [
  { value: "order.created", label: "عند إنشاء الطلب" },
  { value: "order.confirmed", label: "عند تأكيد الطلب" },
  { value: "order.shipped", label: "عند شحن الطلب" },
  { value: "order.delivered", label: "عند تسليم الطلب" },
  { value: "order.failed", label: "عند فشل التوصيل" },
  { value: "order.returned", label: "عند إرجاع الطلب" },
  { value: "order.cancelled", label: "عند إلغاء الطلب" },
  { value: "tracking.updated", label: "عند تحديث التتبع" },
];

const ACTIONS = [
  { value: "send_whatsapp", label: "إرسال واتساب" },
  { value: "send_sms", label: "إرسال SMS" },
  { value: "send_email", label: "إرسال بريد إلكتروني" },
  { value: "notify_admin", label: "تنبيه المسؤول" },
  { value: "update_status", label: "تحديث حالة الطلب" },
  { value: "assign_provider", label: "تعيين شركة شحن" },
];

export function RuleForm({ stores }: { stores: Store[] }) {
  const [state, formAction, pending] = useActionState(createRuleAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [actionType, setActionType] = useState("send_whatsapp");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:opacity-90">
        + قاعدة أتمتة جديدة
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-white">قاعدة أتمتة جديدة</h3>
        <button onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-white">✕ إغلاق</button>
      </div>
      <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-2">
        <select name="storeId" required className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none">
          <option value="">اختر المتجر</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input name="name" required placeholder="اسم القاعدة" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none" />
        <select name="triggerEvent" className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none">
          {EVENTS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <select name="actionType" value={actionType} onChange={(e) => setActionType(e.target.value)} className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none">
          {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
        <input name="wilaya" placeholder="تصفية حسب الولاية (اختياري، مفصولة بفاصلة)" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none sm:col-span-2" />
        <input name="priority" type="number" defaultValue={0} placeholder="الأولوية" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none" />

        {["send_whatsapp", "send_sms", "send_email", "notify_admin"].includes(actionType) ? (
          <input name="template" placeholder="نص الرسالة {{customerName}} {{status}} {{trackingNumber}}" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none sm:col-span-2" />
        ) : null}
        {actionType === "notify_admin" ? (
          <input name="adminEmail" dir="ltr" placeholder="admin@email.com" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none" />
        ) : null}
        {actionType === "update_status" ? (
          <select name="newStatus" className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none">
            <option value="confirmed">مؤكد</option>
            <option value="cancelled">ملغى</option>
            <option value="processing">قيد المعالجة</option>
          </select>
        ) : null}
        {actionType === "assign_provider" ? (
          <select name="provider" className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none">
            <option value="zrexpress">ZRExpress</option>
            <option value="yalidine">Yalidine</option>
            <option value="maystro">Maystro</option>
          </select>
        ) : null}

        {state?.error ? <p className="sm:col-span-2 text-sm text-red-400">{state.error}</p> : null}
        {state?.success ? <p className="sm:col-span-2 text-sm text-emerald-400">{state.success}</p> : null}

        <button type="submit" disabled={pending} className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 sm:col-span-2">
          {pending ? "جاري الإنشاء..." : "إنشاء القاعدة"}
        </button>
      </form>
    </div>
  );
}
