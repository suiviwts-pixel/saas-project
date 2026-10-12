import { db } from "@/db";
import { teamMembers, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "./auth";
import { randomUUID } from "crypto";
import { PLAN_LIMITS, getUsageStats } from "./billing";

export async function listTeamMembers(tenantId: string) {
  return db
    .select({
      id: teamMembers.id,
      role: teamMembers.role,
      isActive: teamMembers.isActive,
      createdAt: teamMembers.createdAt,
      lastLoginAt: teamMembers.lastLoginAt,
      userId: users.id,
      email: users.email,
      fullName: users.fullName,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.tenantId, tenantId));
}

export async function inviteTeamMember(params: {
  tenantId: string;
  invitedBy: string;
  email: string;
  fullName: string;
  role: "owner" | "manager" | "operator" | "viewer";
  tempPassword: string;
}) {
  const members = await listTeamMembers(params.tenantId);
  const limits = PLAN_LIMITS[(await getUsageStats(params.tenantId)).plan];
  if (members.length >= limits.teamMembers) {
    throw new Error(`تم الوصول للحد الأقصى من أعضاء الفريق (${limits.teamMembers}) لخطتك الحالية.`);
  }

  let [user] = await db.select().from(users).where(eq(users.email, params.email.toLowerCase())).limit(1);

  if (!user) {
    const passwordHash = await hashPassword(params.tempPassword);
    [user] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        email: params.email.toLowerCase(),
        passwordHash,
        fullName: params.fullName,
        role: "manager",
      })
      .returning();
  }

  const [existingMembership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.tenantId, params.tenantId), eq(teamMembers.userId, user.id)))
    .limit(1);

  if (existingMembership) {
    throw new Error("هذا المستخدم عضو بالفعل في الفريق");
  }

  const [member] = await db
    .insert(teamMembers)
    .values({
      tenantId: params.tenantId,
      userId: user.id,
      role: params.role,
      invitedBy: params.invitedBy,
      acceptedAt: new Date(),
    })
    .returning();

  return { member, user };
}

export async function removeTeamMember(tenantId: string, memberId: string) {
  const [member] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.id, memberId), eq(teamMembers.tenantId, tenantId)))
    .limit(1);
  if (!member) throw new Error("Member not found");
  if (member.role === "owner") throw new Error("لا يمكن إزالة مالك المتجر");

  await db.delete(teamMembers).where(eq(teamMembers.id, memberId));
}

export async function updateMemberRole(tenantId: string, memberId: string, role: "owner" | "manager" | "operator" | "viewer") {
  const [member] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.id, memberId), eq(teamMembers.tenantId, tenantId)))
    .limit(1);
  if (!member) throw new Error("Member not found");

  const [updated] = await db.update(teamMembers).set({ role }).where(eq(teamMembers.id, memberId)).returning();
  return updated;
}
