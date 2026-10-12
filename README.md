<div align="center">

# 🚀 Hanotify — منصة إدارة العمليات اللوجستية والتجارة الإلكترونية متعددة المستأجرين (Multi-Tenant SaaS)

<p align="center">
  <b>منصة متكاملة مصممة بأحدث التقنيات لإدارة المتاجر الإلكترونية، تتبع الطلبات، أتمتة الشحن، وإرسال الإشعارات بذكاء.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=for-the-badge&logo=drizzle" alt="Drizzle ORM">
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

</div>

---

## 🌟 نظرة عامة على المشروع

**Hanotify** هو نظام SaaS حديث ومتطور متعدد المستأجرين (Multi-Tenant)، مصمم خصيصاً لمساعدة أصحاب المتاجر الإلكترونية (خصوصاً في السوق الجزائري والشرق الأوسط) على إدارة طلباتهم، ربط المتاجر بمنصات التجارة الإلكترونية الكبرى، وأتمتة عمليات الشحن مع شركات التوصيل المحلية (مثل **ZRExpress**، **Yalidine**، و**Maystro**) بكفاءة عالية واحترافية مطلقة.

---

## 🏗️ هيكلية النظام والمخططات المعمارية (Architecture & Data Flow)

يوضح المخطط التالي كيفية تدفق البيانات ومعمارية النظام بين واجهة المستخدم، خوادم Next.js Server Actions، وقاعدة البيانات PostgreSQL:

```mermaid
graph TD
    User["المستخدم / العميل (Client)"] -->|Next.js App Router| Actions["Server Actions / API Routes"]
    Actions --> Auth["نظام التحقق (JWT & Jose)"]
    Actions --> DB[(PostgreSQL + Drizzle ORM)]
    
    subgraph Integrations ["التكاملات الخارجية (Webhooks & Shipping)"]
        Shopify["Shopify Webhook"] --> WebhookHandler["معالج الويب هوك (Webhooks Engine)"]
        Salla["Salla Webhook"] --> WebhookHandler
        Woo["WooCommerce Webhook"] --> WebhookHandler
        WebhookHandler --> OrdersSvc["خدمة إدارة الطلبات (Orders Service)"]
        OrdersSvc --> AutoEngine["محرك الأتمتة (Automation Engine)"]
        AutoEngine --> ShippingProvider["مزود الشحن (Strategy Pattern + Circuit Breaker)"]
    end
    
    DB --> Analytics["لوحة المؤشرات والتحليلات (Analytics)"]
```

---

## ✨ المميزات الرئيسية

* 🏢 **نظام متعدد المستأجرين وعزل كامل للبيانات (Multi-Tenancy):** إدارة الشركات والمتاجر بشكل مستقل وآمن تماماً.
* 👥 **إدارة الصلاحيات المتقدمة (RBAC):** تحديد أدوار المستخدمين بدقة (`owner`، `manager`، `operator`، `viewer`) مع حماية صارمة لكل مسار.
* 🔌 **دعم منصات التجارة الإلكترونية الشهيرة:** ربط واستقبال الطلبات تلقائياً عبر Webhooks خاصة بـ **Shopify**، **Salla**، و**WooCommerce**.
* 📦 **محرك الشحن الذكي (Strategy Pattern & Circuit Breaker):** دعم شركات الشحن الجزائري (`ZRExpress`، `Yalidine`، `Maystro`) مع نظام حماية ضد انقطاع الاتصال (Circuit Breaker).
* ⚙️ **محرك الأتمتة المتقدم (Automation Engine):** إنشاء قواعد تلقائية (مثلاً: عند إنشاء طلب في ولاية معينة، يتم تعيين مزود شحن وإرسال إشعار WhatsApp فوراً).
* 💳 **نظام الفوترة والاشتراكات (Billing & Plans):** خطط متعددة (Free, Starter, Pro, Business, Enterprise) مع تتبع حدود الاستخدام الشهرية والتسعير بالدينار الجزائري (DZD).
* 📊 **لوحة تحليلات تفصيلية:** إحصائيات المبيعات، أداء شركات الشحن، وتوزيع الطلبات حسب الولايات (Wilayas).
* 🛡️ **سجل التدقيق (Audit Logs):** تتبع دقيق لكافة العمليات الحساسة التي يقوم بها أعضاء الفريق داخل المنصة.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

* **الاطار العام:** Next.js 16 (App Router مع Server Actions)
* **لغة البرمجة:** TypeScript 5.9
* **قاعدة البيانات:** PostgreSQL
* **محدد البيانات (ORM):** Drizzle ORM
* **التصميم والتنسيق:** Tailwind CSS v4
* **الأمان والتوثيق:** `jose` (JWT Tokens)، `bcryptjs`، التشفير عبر `aes-256-gcm` للمفاتيح الحساسة.
* **التحقق من البيانات:** Zod

---

## 📂 هيكل مجلدات المشروع (Project Structure)

```text
├── src/
│   ├── app/                      # مسارات Next.js (App Router)
│   │   ├── actions/              # إجراءات الخادم العامة (Authentication, etc.)
│   │   ├── api/                  # نقاط النهاية (Webhooks & Health Check)
│   │   ├── dashboard/            # لوحة التحكم الرئيسية (Orders, Stores, Team, Billing, Audit, Automation)
│   │   ├── login/ & register/    # صفحات المصادقة والتسجيل
│   │   └── page.tsx              # الصفحة الرئيسية للمنصة (Landing Page)
│   ├── db/                       # إعدادات قاعدة البيانات ومخططات Drizzle
│   │   ├── index.ts              # اتصال Pool و Drizzle Client
│   │   └── schema.ts             # تعريف الجداول والعلاقات والأنواع (Enums)
│   ├── lib/                      # المنطق البرمجي والخدمات (Services)
│   │   ├── analytics.ts          # استعلامات التحليلات ولوحة المؤشرات
│   │   ├── audit.ts              # سجلات التدقيق والمراقبة
│   │   ├── auth.ts               # إدارة جلسات العمل وتشفير الكلمات المرورية
│   │   ├── automation.ts         # محرك القواعد الآلية والإشعارات
│   │   ├── billing.ts            # إدارة الخطط والاشتراكات والحدود
│   │   ├── circuit-breaker.ts    # نمط قاطع الدائرة لخدمات الشحن
│   │   ├── encryption.ts         # تشفكير بيانات الاعتماد (AES-256-GCM)
│   │   ├── orders.ts             # إدارة الطلبات والحسابات
│   │   ├── permissions.ts        # نظام التحكم في الصلاحيات RBAC
│   │   ├── stores.ts             # إدارة المتاجر وربط المنصات
│   │   ├── webhooks.ts           # معالجة طلبات الويب هوك الخارجية
│   │   ├── notifications/        # خدمة إرسال الإشعارات (WhatsApp, SMS, Email)
│   │   └── shipping/             # مزودي الشحن (ZRExpress, Yalidine, Maystro + Strategy Pattern)
│   └── proxy.ts                  # وسيط حماية المسارات (Middleware / Proxy)
├── drizzle.config.json           # إعدادات Drizzle Kit
├── next.config.ts                # إعدادات Next.js
├── tailwind.config.js / postcss  # إعدادات التصميم
└── package.json                  # الاعتبارات والتبعيات للمشروع
```

---

## ⚙️ البدء والتشغيل المحلي (Getting Started)

### المتطلبات الأساسية
* Node.js (الإصدار 18 أو أحدث)
* قاعدة بيانات PostgreSQL جاهزة للاستخدام.

### خطوات التثبيت:

1. **استنساخ المستودع (Clone Repository):**
   ```bash
   git clone https://github.com/your-username/hanotify.git
   cd hanotify
   ```

2. **تثبيت الحزم والتبعيات:**
   ```bash
   npm install
   ```

3. **إعداد متغيرات البيئة:**
   أنشئ ملف `.env.local` في جذر المشروع وأضف المتطلبات التالية:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/app_db"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   ENCRYPTION_KEY="your-32-byte-encryption-key-for-secrets"
   ```

4. **تشغيل الهجرة ومزامنة قاعدة البيانات (Drizzle Migrations):**
   ```bash
   npx drizzle-kit push
   ```

5. **تشغيل خادم التطوير (Development Server):**
   ```bash
   npm run dev
   ```
   افتح المتصفح على الرابط: `http://localhost:3000`

---

## 🔗 نقاط النهاية للـ Webhooks (Endpoints)

يدعم النظام استقبال Webhooks مباشرة من المنصات وشركات الشحن عبر الروابط التالية:
* **Shopify:** `/api/webhooks/shopify/{storeId}`
* **Salla:** `/api/webhooks/salla/{storeId}`
* **WooCommerce:** `/api/webhooks/woocommerce/{storeId}`
* **Shipping Providers:** `/api/webhooks/shipping/{provider}/{storeId}`

---

## 🤝 المساهمة والتطوير

نرحب دائماً بالمساهمات وتحسينات المجتمع! يمكنك فتح قضايا (Issues) أو إرسال طلبات سحب (Pull Requests) لتطوير المنصة.

---

## 📄 الرخصة

هذا المشروع مرخص تحت رخصة [MIT](LICENSE).
