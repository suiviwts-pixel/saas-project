"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createOrderAction } from "./actions";

type Store = { id: string; name: string };

const WILAYAS = [
  "الجزائر", "وهران", "قسنطينة", "عنابة", "سطيف", "باتنة", "البليدة", "بجاية",
  "تلمسان", "بسكرة", "سيدي بلعباس", "مستغانم", "تيزي وزو", "الشلف", "غرداية",
];

export function CreateOrderForm({ stores }: { stores: Store[] }) {
  const [state, formAction, pending] = useActionState(createOrderAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:opacity-90"
      >
        + طلب جديد
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-white">إنشاء طلب جديد</h3>
        <button onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-white">✕ إغلاق</button>
      </div>
      <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-3">
        <select name="storeId" required className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none">
          <option value="">اختر المتجر</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <input name="firstName" required placeholder="الاسم الأول" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none" />
        <input name="lastName" required placeholder="اللقب" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none" />
        <input name="phone" required dir="ltr" placeholder="رقم الهاتف" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none" />
        <select name="wilaya" required className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none">
          <option value="">اختر الولاية</option>
          {WILAYAS.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
        <input name="city" required placeholder="البلدية" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none" />
        <input name="address" required placeholder="العنوان" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none sm:col-span-3" />
        <input name="itemName" required placeholder="اسم المنتج" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none" />
        <input name="itemQty" type="number" min={1} defaultValue={1} placeholder="الكمية" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none" />
        <input name="itemPrice" type="number" min={0} step="0.01" required placeholder="السعر (دج)" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none" />
        <input name="shippingCost" type="number" min={0} step="0.01" defaultValue={0} placeholder="تكلفة الشحن" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none" />
        <select name="paymentMethod" className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none">
          <option value="cod">الدفع عند الاستلام</option>
          <option value="online">دفع إلكتروني</option>
          <option value="bank_transfer">تحويل بنكي</option>
        </select>

        {state?.error ? <p className="sm:col-span-3 text-sm text-red-400">{state.error}</p> : null}
        {state?.success ? <p className="sm:col-span-3 text-sm text-emerald-400">{state.success}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 sm:col-span-3"
        >
          {pending ? "جاري الإنشاء..." : "إنشاء الطلب"}
        </button>
      </form>
    </div>
  );
}
