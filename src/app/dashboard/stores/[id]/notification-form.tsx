"use client";

import { useActionState } from "react";
import { updateNotificationConfigAction, type FormState } from "../actions";
import type { NotificationConfig } from "@/db/schema";

export function NotificationConfigForm({ storeId, config }: { storeId: string; config: NotificationConfig }) {
  const action = (prev: FormState, formData: FormData) => updateNotificationConfigAction(storeId, prev, formData);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 p-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <input type="checkbox" name="whatsappEnabled" defaultChecked={config.whatsapp?.enabled} className="h-4 w-4 accent-indigo-500" />
            واتساب
          </label>
          <input
            name="whatsappApiUrl"
            defaultValue={config.whatsapp?.apiUrl}
            placeholder="Webhook API URL"
            dir="ltr"
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white placeholder-slate-600 outline-none"
          />
          <input
            name="whatsappApiKey"
            defaultValue={config.whatsapp?.apiKey}
            placeholder="API Key"
            dir="ltr"
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white placeholder-slate-600 outline-none"
          />
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <input type="checkbox" name="smsEnabled" defaultChecked={config.sms?.enabled} className="h-4 w-4 accent-indigo-500" />
            رسائل SMS
          </label>
          <input
            name="smsSenderId"
            defaultValue={config.sms?.senderId}
            placeholder="Sender ID"
            dir="ltr"
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white placeholder-slate-600 outline-none"
          />
          <input
            name="smsApiKey"
            defaultValue={config.sms?.apiKey}
            placeholder="API Key"
            dir="ltr"
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white placeholder-slate-600 outline-none"
          />
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <input type="checkbox" name="emailEnabled" defaultChecked={config.email?.enabled} className="h-4 w-4 accent-indigo-500" />
            البريد الإلكتروني
          </label>
          <input
            name="emailFrom"
            defaultValue={config.email?.from}
            placeholder="from@store.com"
            dir="ltr"
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white placeholder-slate-600 outline-none"
          />
        </div>
      </div>

      {state?.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "جاري الحفظ..." : "حفظ إعدادات الإشعارات"}
      </button>
    </form>
  );
}
