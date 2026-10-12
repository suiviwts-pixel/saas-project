import { db } from "@/db";
import { teamMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { SessionPayload } from "./auth";

export enum Permission {
  ORDER_VIEW = "order:view",
  ORDER_CREATE = "order:create",
  ORDER_UPDATE = "order:update",
  ORDER_DELETE = "order:delete",
  ORDER_DISPATCH = "order:dispatch",
  ORDER_EXPORT = "order:export",

  STORE_VIEW = "store:view",
  STORE_CREATE = "store:create",
  STORE_UPDATE = "store:update",
  STORE_DELETE = "store:delete",

  TEAM_INVITE = "team:invite",
  TEAM_REMOVE = "team:remove",
  TEAM_VIEW = "team:view",

  BILLING_VIEW = "billing:view",
  BILLING_MANAGE = "billing:manage",

  REPORTS_VIEW = "reports:view",
  REPORTS_EXPORT = "reports:export",

  AUTOMATION_VIEW = "automation:view",
  AUTOMATION_MANAGE = "automation:manage",

  SETTINGS_VIEW = "settings:view",
  SETTINGS_UPDATE = "settings:update",
}

export type TeamRole = "owner" | "manager" | "operator" | "viewer";

export const ROLE_PERMISSIONS: Record<TeamRole, Permission[]> = {
  owner: Object.values(Permission),
  manager: [
    Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_UPDATE,
    Permission.ORDER_DELETE, Permission.ORDER_DISPATCH, Permission.ORDER_EXPORT,
    Permission.STORE_VIEW, Permission.STORE_CREATE, Permission.STORE_UPDATE,
    Permission.TEAM_INVITE, Permission.TEAM_REMOVE, Permission.TEAM_VIEW,
    Permission.REPORTS_VIEW, Permission.REPORTS_EXPORT,
    Permission.AUTOMATION_VIEW, Permission.AUTOMATION_MANAGE,
    Permission.SETTINGS_VIEW, Permission.SETTINGS_UPDATE,
  ],
  operator: [
    Permission.ORDER_VIEW, Permission.ORDER_CREATE,
    Permission.ORDER_UPDATE, Permission.ORDER_DISPATCH,
    Permission.STORE_VIEW, Permission.REPORTS_VIEW,
    Permission.AUTOMATION_VIEW,
  ],
  viewer: [
    Permission.ORDER_VIEW, Permission.STORE_VIEW,
    Permission.REPORTS_VIEW, Permission.BILLING_VIEW,
  ],
};

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: "مالك",
  manager: "مدير",
  operator: "مشغل",
  viewer: "مشاهد",
};

export async function getTeamMembership(tenantId: string, userId: string) {
  const [member] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.tenantId, tenantId), eq(teamMembers.userId, userId)))
    .limit(1);
  return member ?? null;
}

export async function getPermissions(session: SessionPayload): Promise<Permission[]> {
  const member = await getTeamMembership(session.tenantId, session.sub);
  if (!member || !member.isActive) return [];
  const rolePerms = ROLE_PERMISSIONS[member.role as TeamRole] ?? [];
  const custom = (member.customPermissions ?? []) as Permission[];
  return Array.from(new Set([...rolePerms, ...custom]));
}

export async function hasPermission(session: SessionPayload, permission: Permission): Promise<boolean> {
  const perms = await getPermissions(session);
  return perms.includes(permission);
}

export class ForbiddenError extends Error {
  constructor(message = "ليست لديك الصلاحية الكافية لتنفيذ هذا الإجراء") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requirePermission(session: SessionPayload, permission: Permission): Promise<void> {
  const ok = await hasPermission(session, permission);
  if (!ok) {
    throw new ForbiddenError(`Missing required permission: ${permission}`);
  }
}
