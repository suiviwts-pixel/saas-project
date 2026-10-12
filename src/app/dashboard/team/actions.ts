"use server";

import { getSession } from "@/lib/auth";
import { requirePermission, Permission } from "@/lib/permissions";
import { inviteTeamMember, removeTeamMember, updateMemberRole } from "@/lib/team";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export type FormState = { error?: string; success?: string } | undefined;

export async function inviteMemberAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  try {
    await requirePermission(session, Permission.TEAM_INVITE);

    const email = String(formData.get("email") || "").trim().toLowerCase();
    const fullName = String(formData.get("fullName") || "").trim();
    const role = String(formData.get("role") || "operator") as "owner" | "manager" | "operator" | "viewer";

    if (!email || !fullName) return { error: "يرجى تعبئة جميع الحقول" };

    const tempPassword = randomUUID().slice(0, 12);
    const { user } = await inviteTeamMember({
      tenantId: session.tenantId,
      invitedBy: session.sub,
      email,
      fullName,
      role,
      tempPassword,
    });

    await logAudit({ tenantId: session.tenantId, userId: session.sub, action: "invite", resource: "team_member", resourceId: user.id });

    revalidatePath("/dashboard/team");
    return { success: `تمت إضافة ${fullName} بنجاح. كلمة المرور المؤقتة: ${tempPassword}` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "حدث خطأ" };
  }
}

export async function removeMemberAction(memberId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await requirePermission(session, Permission.TEAM_REMOVE);
  await removeTeamMember(session.tenantId, memberId);
  await logAudit({ tenantId: session.tenantId, userId: session.sub, action: "remove", resource: "team_member", resourceId: memberId });
  revalidatePath("/dashboard/team");
}

export async function updateRoleAction(memberId: string, role: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await requirePermission(session, Permission.TEAM_INVITE);
  await updateMemberRole(session.tenantId, memberId, role as any);
  await logAudit({ tenantId: session.tenantId, userId: session.sub, action: "update_role", resource: "team_member", resourceId: memberId, changes: { role } });
  revalidatePath("/dashboard/team");
}
