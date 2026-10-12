import Link from "next/link";
import { getSession } from "@/lib/auth";
import { PLAN_LIMITS } from "@/lib/billing";

export const dynamic = "force-dynamic";

const features = [
  {
    icon: "🏢",
    title: "عزل كامل متعدد المستأجرين",
    desc: "كل حساب معزول تمامًا بياناته وطلباته ومتاجره عن باقي المستأجرين على مستوى قاعدة البيانات.",
  },
  {
    icon: "🔐",
    title: "صلاحيات دقيقة (RBAC)",
    desc: "أربعة أدوار (مالك، مدير، مشغل، مشاهد) مع أكثر من 18 صلاحية قابلة للتخصيص لكل عضو فريق.",
  },
  {
    icon: "🚚",
    title: "تكامل شركات التوصيل",
    desc: "ZRExpress وYalidine وMaystro عبر طبقة تجريد موحدة (Strategy Pattern) مع Circuit Breaker للحماية من الأعطال.",
  },
  {
    icon: "🛍️",
    title: "Webhooks للمتاجر",
    desc: "استقبال الطلبات تلقائيًا من Shopify وSalla وWooCommerce فور إتمام عملية الشراء.",
  },
  {
    icon: "🤖",
    title: "محرك الأتمتة",
    desc: "قواعد ذكية مرتبطة بأحداث الطلب (إنشاء، شحن، تسليم...) لتنفيذ إجراءات تلقائية كإرسال إشعارات أو تغيير الحالة.",
  },
  {
    icon: "📱",
    title: "إشعارات متعددة القنوات",
    desc: "واتساب، رسائل SMS، وبريد إلكتروني لإبقاء عملائك على اطلاع بحالة شحناتهم لحظة بلحظة.",
  },
  {
    icon: "📊",
    title: "تحليلات متقدمة",
    desc: "أداء شركات التوصيل، إحصائيات الولايات، الإيرادات اليومية وكل ما تحتاجه لاتخاذ قرارات مبنية على بيانات.",
  },
  {
    icon: "🧾",
    title: "سجل تدقيق شامل",
    desc: "تتبع كل إجراء يقوم به أعضاء فريقك لضمان الشفافية والأمان الكامل.",
  },
];

export default async function HomePage() {
  const session = await getSession();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-indigo-950">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 font-black text-white">H</div>
          <span className="text-lg font-bold text-white">Hanotify</span>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <Link href="/dashboard" className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200">
              لوحة التحكم
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:opacity-90">
                ابدأ مجانًا
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-6 pb-16 pt-12 text-center">
        <span className="inline-block rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1 text-xs font-semibold tracking-wide text-indigo-300">
          منصة SaaS متعددة المستأجرين لإدارة اللوجستيك
        </span>
        <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-6xl">
          أدر طلباتك وشحناتك
          <span className="bg-gradient-to-l from-indigo-400 to-cyan-300 bg-clip-text text-transparent"> في منصة واحدة</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          اربط متجرك الإلكتروني بشركات التوصيل، أتمت دورة حياة الطلب بالكامل، وتابع الأداء عبر تحليلات دقيقة —
          كل ذلك مع عزل تام للبيانات وصلاحيات متقدمة لفريقك.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/register" className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-7 py-3 font-bold text-white shadow-xl hover:opacity-90">
            ابدأ تجربتك المجانية
          </Link>
          <Link href="/login" className="rounded-xl border border-white/15 px-7 py-3 font-bold text-white hover:bg-white/5">
            لدي حساب
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="text-3xl">{feature.icon}</div>
              <h3 className="mt-4 font-bold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-black text-white">خطط تناسب حجم أعمالك</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-400">ترقّ أو نزّل في أي وقت حسب احتياجاتك.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.entries(PLAN_LIMITS) as [string, (typeof PLAN_LIMITS)[keyof typeof PLAN_LIMITS]][]).map(([key, plan]) => (
            <div key={key} className={`rounded-2xl border p-6 ${key === "pro" ? "border-indigo-400 bg-indigo-500/10 shadow-xl" : "border-white/10 bg-white/5"}`}>
              <h3 className="font-bold text-white">{plan.label}</h3>
              <p className="mt-2 text-2xl font-black text-white">
                {plan.priceDZD === 0 ? "مجانًا" : `${plan.priceDZD.toLocaleString()} دج`}
                {plan.priceDZD > 0 ? <span className="text-sm font-normal text-slate-400">/شهر</span> : null}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li>📦 {plan.ordersPerMonth === Infinity ? "طلبات غير محدودة" : `${plan.ordersPerMonth.toLocaleString()} طلب/شهر`}</li>
                <li>🏬 {plan.stores === Infinity ? "متاجر غير محدودة" : `${plan.stores} متجر`}</li>
                <li>👥 {plan.teamMembers === Infinity ? "أعضاء غير محدودين" : `${plan.teamMembers} أعضاء فريق`}</li>
                <li>⚙️ {plan.automationRules === Infinity ? "قواعد أتمتة غير محدودة" : `${plan.automationRules} قاعدة أتمتة`}</li>
              </ul>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Hanotify. جميع الحقوق محفوظة.
      </footer>
    </main>
  );
}
