"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-900 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-xl font-black text-white shadow-lg">
            H
          </div>
          <h1 className="text-2xl font-bold text-white">إنشاء حساب جديد</h1>
          <p className="mt-2 text-sm text-slate-400">ابدأ تجربتك المجانية الآن — 50 طلب شهريًا مجانًا</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">الاسم الكامل</label>
            <input
              name="fullName"
              type="text"
              required
              placeholder="محمد أحمد"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">اسم الشركة / المتجر</label>
            <input
              name="companyName"
              type="text"
              required
              placeholder="متجر النخبة"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">البريد الإلكتروني</label>
            <input
              name="email"
              type="email"
              required
              dir="ltr"
              placeholder="you@company.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">كلمة المرور</label>
            <input
              name="password"
              type="password"
              required
              dir="ltr"
              minLength={8}
              placeholder="8 أحرف على الأقل"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-indigo-400"
            />
          </div>

          {state?.error ? (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 border border-red-500/20">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2.5 font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "جاري الإنشاء..." : "إنشاء الحساب"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="font-semibold text-indigo-300 hover:text-indigo-200">
            سجل الدخول
          </Link>
        </p>
      </div>
    </main>
  );
}
