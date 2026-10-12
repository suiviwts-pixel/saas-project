"use client";

import { useActionState, useRef, useEffect } from "react";
import { createStoreAction } from "./actions";

export function CreateStoreForm() {
  const [state, formAction, pending] = useActionState(createStoreAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-4">
      <input
        name="name"
        required
        placeholder="اسم المتجر"
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400 sm:col-span-1"
      />
      <select name="platform" className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400">
        <option value="custom">مخصص</option>
        <option value="shopify">Shopify</option>
        <option value="salla">Salla</option>
        <option value="woocommerce">WooCommerce</option>
      </select>
      <input
        name="storeUrl"
        placeholder="رابط المتجر (اختياري)"
        dir="ltr"
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "جاري الإنشاء..." : "+ إنشاء متجر"}
      </button>
      {state?.error ? <p className="sm:col-span-4 text-sm text-red-400">{state.error}</p> : null}
      {state?.success ? <p className="sm:col-span-4 text-sm text-emerald-400">{state.success}</p> : null}
    </form>
  );
}
