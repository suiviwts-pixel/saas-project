"use server";

import { db } from "@/db";
import { tenants, users, teamMembers, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { comparePassword, hashPassword, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";

export type AuthFormState = { error?: string } | undefined;

export async function registerAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const fullName = String(formData.get("fullName") || "").trim();
  const companyName = String(formData.get("companyName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!fullName || !companyName || !email || !password) {
    return { error: "يرجى تعبئة جميع الحقول" };
  }
  if (password.length < 8) {
    return { error: "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل" };
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return { error: "هذا البريد الإلكتروني مستخدم بالفعل" };
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, fullName, role: "store_owner" })
    .returning();

  const [tenant] = await db.insert(tenants).values({ name: companyName, ownerId: user.id }).returning();

  await db.insert(teamMembers).values({
    tenantId: tenant.id,
    userId: user.id,
    role: "owner",
    acceptedAt: new Date(),
  });

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  await db.insert(subscriptions).values({
    tenantId: tenant.id,
    plan: "free",
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
  });

  await setSessionCookie({ sub: user.id, email: user.email, tenantId: tenant.id, fullName: user.fullName, role: user.role });
  await logAudit({ tenantId: tenant.id, userId: user.id, action: "register", resource: "tenant", resourceId: tenant.id });

  redirect("/dashboard");
}

export async function loginAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "يرجى إدخال البريد الإلكتروني وكلمة المرور" };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return { error: "بيانات الدخول غير صحيحة" };
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return { error: "بيانات الدخول غير صحيحة" };
  }

  if (!user.isActive) {
    return { error: "تم تعطيل هذا الحساب. يرجى التواصل مع الدعم" };
  }

  const [membership] = await db.select().from(teamMembers).where(eq(teamMembers.userId, user.id)).limit(1);
  if (!membership) {
    return { error: "لا يوجد مستأجر مرتبط بهذا الحساب" };
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  await setSessionCookie({
    sub: user.id,
    email: user.email,
    tenantId: membership.tenantId,
    fullName: user.fullName,
    role: user.role,
  });

  await logAudit({ tenantId: membership.tenantId, userId: user.id, action: "login", resource: "session" });

  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
