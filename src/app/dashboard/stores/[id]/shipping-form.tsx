"use client";

import { useActionState } from "react";
import { updateShippingConfigAction, type FormState } from "../actions";
import type { ShippingConfig } from "@/db/schema";

export function ShippingConfigForm({ storeId, config }: { storeId: string; config: ShippingConfig }) {
  const action = (prev: FormState, formData: FormData) => updateShippingConfigAction(storeId, prev, formData);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">شركة الشحن الافتراضية</label>
          <select
            name="defaultProvider"
            defaultValue={config.defaultProvider}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
          >
            <option value="zrexpress">ZRExpress</option>
            <option value="yalidine">Yalidine</option>
            <option value="maystro">Maystro</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">نوع الخدمة الافتراضي</label>
          <input
            name="defaultServiceType"
            defaultValue={config.settings.defaultServiceType}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">API Key</label>
          <input
            name="apiKey"
            dir="ltr"
            placeholder="••••••••"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Token</label>
          <input
            name="token"
            dir="ltr"
            placeholder="••••••••"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="autoDispatch" defaultChecked={config.settings.autoDispatch} className="h-4 w-4 rounded accent-indigo-500" />
          إرسال الطلبات تلقائيًا لشركة الشحن
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="insuranceEnabled" defaultChecked={config.settings.insuranceEnabled} className="h-4 w-4 rounded accent-indigo-500" />
          تفعيل التأمين على الشحنات
        </label>
      </div>

      {state?.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "جاري الحفظ..." : "حفظ إعدادات الشحن"}
      </button>
    </form>
  );
}
