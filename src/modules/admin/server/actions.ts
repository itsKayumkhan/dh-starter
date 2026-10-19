"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/server";
import { safeAction } from "@/lib/safe-action";
import { writeAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { InviteUser } from "@/lib/email/templates/invite-user";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { getServerEnv } from "@/lib/env/server";
import { ROUTES } from "@/lib/constants/routes";
import { ADMIN_ROUTES } from "@/modules/admin/routes";
import { banDurationSeconds, banUserSchema, changeRoleSchema, inviteUserSchema, mayChangeRole, userIdSchema } from "@/modules/admin/schemas/admin";

const actionRateLimit = { key: "admin-users", limit: 30, windowSec: 60 };

function refreshUsers(id?: string) {
  revalidatePath(ADMIN_ROUTES.users);
  if (id) revalidatePath(ADMIN_ROUTES.user(id));
  revalidatePath(ADMIN_ROUTES.audit);
}

async function targetUser(id: string) {
  const user = await db.user.findUnique({ where: { id }, select: { id: true, role: true, name: true, email: true, banned: true } });
  if (!user) throw new NotFoundError();
  return user;
}

export const changeRole = safeAction({ schema: changeRoleSchema, permission: "users:write", rateLimit: actionRateLimit }, async ({ id, role }, { user, ip }) => {
  if (!user) throw new ForbiddenError();
  const previousRole = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(572931)`;
    const target = await tx.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) throw new NotFoundError();
    const adminCount = target.role === "admin" && role !== "admin" ? await tx.user.count({ where: { role: "admin", banned: false } }) : 0;
    if (!mayChangeRole(user.id, id, target.role, role, adminCount)) throw new ConflictError();
    if (target.role !== role) await tx.user.update({ where: { id }, data: { role } });
    return target.role;
  });
  if (previousRole === role) return { id, role };
  await writeAudit({ actorId: user.id, action: "user.role_changed", target: { type: "user", id }, meta: { from: previousRole, to: role }, ip });
  refreshUsers(id);
  return { id, role };
});

export const banUser = safeAction({ schema: banUserSchema, permission: "users:ban", rateLimit: actionRateLimit }, async ({ id, reason, expiresAt }, { user, ip }) => {
  if (!user || user.role !== "admin" || id === user.id) throw new ForbiddenError();
  const banExpiresIn = banDurationSeconds(expiresAt, new Date());
  if (expiresAt && !banExpiresIn) throw new AppError("INVALID_EXPIRY", "Expiry must be in the future.");
  const authHeaders = await headers();
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(572931)`;
    const target = await tx.user.findUnique({ where: { id }, select: { role: true, banned: true } });
    if (!target) throw new NotFoundError();
    if (target.role === "admin" && !target.banned && await tx.user.count({ where: { role: "admin", banned: false } }) <= 1) throw new ConflictError();
    await auth.api.banUser({ headers: authHeaders, body: { userId: id, banReason: reason, ...(banExpiresIn ? { banExpiresIn } : {}) } });
  });
  await writeAudit({ actorId: user.id, action: "user.banned", target: { type: "user", id }, meta: { reason, expiresAt: expiresAt ?? null }, ip });
  refreshUsers(id);
  return { id };
});

export const unbanUser = safeAction({ schema: userIdSchema, permission: "users:ban", rateLimit: actionRateLimit }, async ({ id }, { user, ip }) => {
  if (!user || user.role !== "admin") throw new ForbiddenError();
  await targetUser(id);
  await auth.api.unbanUser({ headers: await headers(), body: { userId: id } });
  await writeAudit({ actorId: user.id, action: "user.unbanned", target: { type: "user", id }, ip });
  refreshUsers(id);
  return { id };
});

export const revokeUserSessions = safeAction({ schema: userIdSchema, permission: "users:write", rateLimit: actionRateLimit }, async ({ id }, { user, ip }) => {
  if (!user || user.role !== "admin") throw new ForbiddenError();
  await targetUser(id);
  await auth.api.revokeUserSessions({ headers: await headers(), body: { userId: id } });
  await writeAudit({ actorId: user.id, action: "user.sessions_revoked", target: { type: "user", id }, ip });
  refreshUsers(id);
  return { id };
});

export const inviteUser = safeAction({ schema: inviteUserSchema, permission: "users:write", rateLimit: { key: "admin-invite", limit: 10, windowSec: 60 } }, async ({ name, email, role }, { user, ip }) => {
  if (!user || user.role !== "admin") throw new ForbiddenError();
  const authHeaders = await headers();
  const created = await auth.api.createUser({
    headers: authHeaders,
    body: { name, email, role: role === "staff" ? "user" : role, password: randomBytes(48).toString("base64url"), data: { emailVerified: true } },
  });
  const id = created.user.id;
  try {
    if (role === "staff") await db.user.update({ where: { id }, data: { role } });
    // Better Auth's reset endpoint consumes verification values with this identifier.
    const token = randomBytes(32).toString("base64url");
    const context = await auth.$context;
    await context.internalAdapter.createVerificationValue({
      identifier: `reset-password:${token}`,
      value: id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    const callbackURL = new URL(ADMIN_ROUTES.resetPassword, getServerEnv().BETTER_AUTH_URL).toString();
    const url = new URL(`${ROUTES.authApi}/reset-password/${token}`, getServerEnv().BETTER_AUTH_URL);
    url.searchParams.set("callbackURL", callbackURL);
    await sendEmail({ to: email, subject: "You are invited", react: InviteUser({ name, url: url.toString() }) });
  } catch (error) {
    await auth.api.removeUser({ headers: authHeaders, body: { userId: id } });
    throw error;
  }
  await writeAudit({ actorId: user.id, action: "user.invited", target: { type: "user", id }, meta: { email, role }, ip });
  refreshUsers(id);
  return { id };
});

export const deleteUser = safeAction({ schema: userIdSchema, permission: "users:write", rateLimit: actionRateLimit }, async ({ id }, { user, ip }) => {
  if (!user || user.role !== "admin" || id === user.id) throw new ForbiddenError();
  const authHeaders = await headers();
  const target = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(572931)`;
    const current = await tx.user.findUnique({ where: { id }, select: { email: true, role: true, banned: true } });
    if (!current) throw new NotFoundError();
    if (current.role === "admin" && !current.banned && await tx.user.count({ where: { role: "admin", banned: false } }) <= 1) throw new ConflictError();
    await auth.api.removeUser({ headers: authHeaders, body: { userId: id } });
    return current;
  });
  await writeAudit({ actorId: user.id, action: "user.deleted", target: { type: "user", id }, meta: { email: target.email, role: target.role }, ip });
  refreshUsers(id);
  return { id };
});
