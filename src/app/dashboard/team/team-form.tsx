"use client";

import { useActionState, useRef, useEffect } from "react";
import { inviteMemberAction } from "./actions";

export function InviteMemberForm() {
  const [state, formAction, pending] = useActionState(inviteMemberAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-4">
      <input name="fullName" required placeholder="الاسم الكامل" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none" />
      <input name="email" type="email" required dir="ltr" placeholder="البريد الإلكتروني" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none" />
      <select name="role" className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none">
        <option value="manager">مدير</option>
        <option value="operator">مشغل</option>
        <option value="viewer">مشاهد</option>
      </select>
      <button type="submit" disabled={pending} className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
        {pending ? "جاري الإضافة..." : "+ دعوة عضو"}
      </button>
      {state?.error ? <p className="sm:col-span-4 text-sm text-red-400">{state.error}</p> : null}
      {state?.success ? <p className="sm:col-span-4 text-sm text-emerald-400">{state.success}</p> : null}
    </form>
  );
}
