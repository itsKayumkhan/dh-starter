import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/auth/permissions";
import { z } from "zod";
import { auditDateSchema } from "@/modules/admin/schemas/admin";

type Sort = { field: string; dir: "asc" | "desc" };
type UserListInput = {
  skip: number;
  take: number;
  q: string;
  sort: Sort;
  filters: { role?: string; status?: string };
};
type AuditListInput = {
  skip: number;
  take: number;
  q: string;
  sort: Sort;
  filters: { action?: string; actor?: string; from?: string; to?: string };
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  status: "active" | "banned" | "unverified";
  createdAt: string;
  lastActive: string | null;
  sessionCount: number;
};

function statusOf(user: { banned: boolean; emailVerified: boolean }): UserRow["status"] {
  if (user.banned) return "banned";
  return user.emailVerified ? "active" : "unverified";
}

const userSelection = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  banned: true,
  emailVerified: true,
  createdAt: true,
  sessions: { orderBy: { updatedAt: "desc" as const }, take: 1, select: { updatedAt: true } },
  _count: { select: { sessions: true } },
} satisfies Prisma.UserSelect;

export async function listUsers(input: UserListInput): Promise<{ data: UserRow[]; total: number }> {
  const role = ROLES.find((value) => value === input.filters.role);
  const status = input.filters.status;
  if (input.filters.role && !role) return { data: [], total: 0 };
  if (status && !["active", "banned", "unverified"].includes(status)) return { data: [], total: 0 };
  const where: Prisma.UserWhereInput = {
    ...(input.q ? { OR: [
      { name: { contains: input.q, mode: "insensitive" } },
      { email: { contains: input.q, mode: "insensitive" } },
    ] } : {}),
    ...(role ? { role } : {}),
    ...(status === "banned" ? { banned: true } : {}),
    ...(status === "unverified" ? { banned: false, emailVerified: false } : {}),
    ...(status === "active" ? { banned: false, emailVerified: true } : {}),
  };
  const field = ["name", "email", "role", "createdAt"].includes(input.sort.field) ? input.sort.field : "createdAt";
  const orderBy = { [field]: input.sort.dir } as Prisma.UserOrderByWithRelationInput;
  const [users, total] = await Promise.all([
    db.user.findMany({ where, select: userSelection, skip: input.skip, take: input.take, orderBy: [orderBy, { id: "asc" }] }),
    db.user.count({ where }),
  ]);
  return {
    data: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      status: statusOf(user),
      createdAt: user.createdAt.toISOString(),
      lastActive: user.sessions[0]?.updatedAt.toISOString() ?? null,
      sessionCount: user._count.sessions,
    })),
    total,
  };
}

export async function getUserDetail(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    select: {
      ...userSelection,
      banReason: true,
      banExpires: true,
      accounts: { select: { providerId: true, createdAt: true } },
      sessions: { orderBy: { updatedAt: "desc" }, select: { id: true, createdAt: true, updatedAt: true, expiresAt: true, ipAddress: true, userAgent: true } },
    },
  });
  if (!user) return null;
  const recentAudit = await db.auditLog.findMany({
    where: { targetType: "user", targetId: id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, action: true, createdAt: true, actorId: true },
  });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    status: statusOf(user),
    createdAt: user.createdAt.toISOString(),
    lastActive: user.sessions[0]?.updatedAt.toISOString() ?? null,
    sessionCount: user._count.sessions,
    banReason: user.banReason,
    banExpires: user.banExpires?.toISOString() ?? null,
    accounts: user.accounts.map((account) => ({ provider: account.providerId, linkedAt: account.createdAt.toISOString() })),
    sessions: user.sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt.toISOString(),
      lastActive: session.updatedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    })),
    recentAudit: recentAudit.map((entry) => ({ ...entry, createdAt: entry.createdAt.toISOString() })),
  };
}

export type AuditRow = {
  id: string;
  action: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  targetType: string;
  targetId: string | null;
  createdAt: string;
  meta: Prisma.JsonValue;
};

export async function listAuditLogs(input: AuditListInput): Promise<{ data: AuditRow[]; total: number }> {
  const from = auditDateSchema.safeParse(input.filters.from);
  const to = auditDateSchema.safeParse(input.filters.to);
  const action = z.string().max(120).safeParse(input.filters.action);
  const actor = z.string().max(128).safeParse(input.filters.actor);
  if ((input.filters.from && !from.success) || (input.filters.to && !to.success) || (input.filters.action && !action.success) || (input.filters.actor && !actor.success)) return { data: [], total: 0 };
  const where: Prisma.AuditLogWhereInput = {
    ...(input.q ? { OR: [
      { action: { contains: input.q, mode: "insensitive" } },
      { targetId: { contains: input.q, mode: "insensitive" } },
    ] } : {}),
    ...(action.success ? { action: action.data } : {}),
    ...(actor.success ? { actorId: actor.data } : {}),
    ...(from.success || to.success ? { createdAt: {
      ...(from.success ? { gte: new Date(`${from.data}T00:00:00.000Z`) } : {}),
      ...(to.success ? { lt: new Date(new Date(`${to.data}T00:00:00.000Z`).getTime() + 86_400_000) } : {}),
    } } : {}),
  };
  const field = ["action", "createdAt"].includes(input.sort.field) ? input.sort.field : "createdAt";
  const orderBy = { [field]: input.sort.dir } as Prisma.AuditLogOrderByWithRelationInput;
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({ where, skip: input.skip, take: input.take, orderBy: [orderBy, { id: "asc" }], select: { id: true, action: true, actorId: true, targetType: true, targetId: true, createdAt: true, meta: true } }),
    db.auditLog.count({ where }),
  ]);
  const actorIds = [...new Set(logs.flatMap((log) => log.actorId ? [log.actorId] : []))];
  const actors = actorIds.length ? await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } }) : [];
  const actorMap = new Map(actors.map((actor) => [actor.id, actor]));
  return {
    data: logs.map((log) => ({
      ...log,
      actorName: log.actorId ? actorMap.get(log.actorId)?.name ?? null : null,
      actorEmail: log.actorId ? actorMap.get(log.actorId)?.email ?? null : null,
      createdAt: log.createdAt.toISOString(),
    })),
    total,
  };
}

export async function listAuditActions() {
  const actions = await db.auditLog.findMany({ distinct: ["action"], orderBy: { action: "asc" }, select: { action: true }, take: 100 });
  return actions.map((entry) => entry.action);
}
