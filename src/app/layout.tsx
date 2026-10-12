import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hanotify — منصة إدارة الطلبات والشحن متعددة المستأجرين",
  description: "نظام SaaS لإدارة طلبات المتاجر الإلكترونية، التوصيل، الأتمتة والتحليلات في مكان واحد.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
