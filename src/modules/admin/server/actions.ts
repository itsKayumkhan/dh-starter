"use server";

import { createElement } from "react";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/server";
import { runUserDeleteHooks } from "@/lib/auth/user-deletion";
import { safeAction } from "@/lib/safe-action";
import { writeAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { InviteUser } from "@/lib/email/templates/invite-user";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import { getServerEnv } from "@/lib/env/server";
import { ROUTES } from "@/lib/constants/routes";
import { ADMIN_ROUTES } from "@/modules/admin/routes";
import {
  banDurationSeconds,
  banUserSchema,
  changeRoleSchema,
  inviteUserSchema,
  mayChangeRole,
  userIdSchema,
} from "@/modules/admin/schemas/admin";

const actionRateLimit = { key: "admin-users", limit: 30, windowSec: 60 };

function refreshUsers(id?: string) {
  revalidatePath(ADMIN_ROUTES.users);
  if (id) revalidatePath(ADMIN_ROUTES.user(id));
  revalidatePath(ADMIN_ROUTES.audit);
}

async function finishAudit(id: string, action: string, targetId?: string) {
  await db.auditLog.update({
    where: { id },
    data: { action, ...(targetId ? { targetId } : {}) },
  });
}

export const changeRole = safeAction(
  {
    schema: changeRoleSchema,
    permission: "users:write",
    rateLimit: actionRateLimit,
  },
  async ({ id, role }, { user, ip }) => {
    if (!user) throw new ForbiddenError();
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(572931)`;
      const target = await tx.user.findUnique({
        where: { id },
        select: { role: true },
      });
      if (!target) throw new NotFoundError();
      const adminCount =
        target.role === "admin" && role !== "admin"
          ? await tx.user.count({ where: { role: "admin", banned: false } })
          : 0;
      if (!mayChangeRole(user.id, id, target.role, role, adminCount))
        throw new ConflictError();
      if (target.role !== role) {
        await tx.user.update({ where: { id }, data: { role } });
        await writeAudit(
          {
            actorId: user.id,
            action: "user.role_changed",
            target: { type: "user", id },
            meta: { from: target.role, to: role },
            ip,
          },
          tx,
        );
      }
    });
    refreshUsers(id);
    return { id, role };
  },
);

export const banUser = safeAction(
  {
    schema: banUserSchema,
    permission: "users:ban",
    rateLimit: actionRateLimit,
  },
  async ({ id, reason, expiresAt }, { user, ip }) => {
    if (!user || user.role !== "admin" || id === user.id)
      throw new ForbiddenError();
    const banExpiresIn = banDurationSeconds(expiresAt, new Date());
    if (expiresAt && !banExpiresIn)
      throw new AppError("INVALID_EXPIRY", "Expiry must be in the future.");
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(572931)`;
      const target = await tx.user.findUnique({
        where: { id },
        select: { role: true, banned: true },
      });
      if (!target) throw new NotFoundError();
      if (
        target.role === "admin" &&
        !target.banned &&
        (await tx.user.count({ where: { role: "admin", banned: false } })) <= 1
      )
        throw new ConflictError();
      await tx.user.update({
        where: { id },
        data: {
          banned: true,
          banReason: reason,
          banExpires: banExpiresIn
            ? new Date(Date.now() + banExpiresIn * 1000)
            : null,
        },
      });
      await tx.session.deleteMany({ where: { userId: id } });
      await writeAudit(
        {
          actorId: user.id,
          action: "user.banned",
          target: { type: "user", id },
          meta: { reason, expiresAt: expiresAt ?? null },
          ip,
        },
        tx,
      );
    });
    refreshUsers(id);
    return { id };
  },
);

export const unbanUser = safeAction(
  { schema: userIdSchema, permission: "users:ban", rateLimit: actionRateLimit },
  async ({ id }, { user, ip }) => {
    if (!user || user.role !== "admin" || id === user.id)
      throw new ForbiddenError();
    await db.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!target) throw new NotFoundError();
      await tx.user.update({
        where: { id },
        data: { banned: false, banReason: null, banExpires: null },
      });
      await writeAudit(
        {
          actorId: user.id,
          action: "user.unbanned",
          target: { type: "user", id },
          ip,
        },
        tx,
      );
    });
    refreshUsers(id);
    return { id };
  },
);

export const revokeUserSessions = safeAction(
  {
    schema: userIdSchema,
    permission: "users:write",
    rateLimit: actionRateLimit,
  },
  async ({ id }, { user, ip }) => {
    if (!user || user.role !== "admin" || id === user.id)
      throw new ForbiddenError();
    await db.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!target) throw new NotFoundError();
      await tx.session.deleteMany({ where: { userId: id } });
      await writeAudit(
        {
          actorId: user.id,
          action: "user.sessions_revoked",
          target: { type: "user", id },
          ip,
        },
        tx,
      );
    });
    refreshUsers(id);
    return { id };
  },
);

export const inviteUser = safeAction(
  {
    schema: inviteUserSchema,
    permission: "users:write",
    rateLimit: { key: "admin-invite", limit: 10, windowSec: 60 },
  },
  async ({ name, email, role }, { user, ip }) => {
    if (!user || user.role !== "admin") throw new ForbiddenError();
    const attempt = await writeAudit({
      actorId: user.id,
      action: "user.invite_attempted",
      target: { type: "user" },
      meta: { email, role },
      ip,
    });
    const authHeaders = await headers();
    const created = await auth.api.createUser({
      headers: authHeaders,
      body: {
        name,
        email,
        role: role === "staff" ? undefined : role,
        password: randomBytes(48).toString("base64url"),
        data: { emailVerified: true, ...(role === "staff" ? { role } : {}) },
      },
    });
    const id = created.user.id;
    try {
      // Better Auth's reset endpoint consumes verification values with this identifier.
      const token = randomBytes(32).toString("base64url");
      const context = await auth.$context;
      await context.internalAdapter.createVerificationValue({
        identifier: `reset-password:${token}`,
        value: id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      const callbackURL = new URL(
        ADMIN_ROUTES.resetPassword,
        getServerEnv().BETTER_AUTH_URL,
      ).toString();
      const url = new URL(
        `${ROUTES.authApi}/reset-password/${token}`,
        getServerEnv().BETTER_AUTH_URL,
      );
      url.searchParams.set("callbackURL", callbackURL);
      await sendEmail({
        to: email,
        subject: "You are invited",
        react: createElement(InviteUser, { name, url: url.toString() }),
      });
    } catch (error) {
      await auth.api.removeUser({ headers: authHeaders, body: { userId: id } });
      throw error;
    }
    await finishAudit(attempt.id, "user.invited", id);
    refreshUsers(id);
    return { id };
  },
);

export const deleteUser = safeAction(
  {
    schema: userIdSchema,
    permission: "users:write",
    rateLimit: actionRateLimit,
  },
  async ({ id }, { user, ip }) => {
    if (!user || user.role !== "admin" || id === user.id)
      throw new ForbiddenError();
    const authHeaders = await headers();
    const attempt = await db.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(572931)`;
        const current = await tx.user.findUnique({
          where: { id },
          select: { email: true, role: true, banned: true },
        });
        if (!current) throw new NotFoundError();
        if (
          current.role === "admin" &&
          !current.banned &&
          (await tx.user.count({ where: { role: "admin", banned: false } })) <=
            1
        )
          throw new ConflictError();
        const attempt = await writeAudit({
          actorId: user.id,
          action: "user.delete_attempted",
          target: { type: "user", id },
          meta: { email: current.email, role: current.role },
          ip,
        });
        // Admin removeUser deletes sessions before the user row and skips beforeDelete,
        // so module cleanup (billing, notifications) runs first and blocks on failure.
        await runUserDeleteHooks(id);
        await auth.api.removeUser({
          headers: authHeaders,
          body: { userId: id },
        });
        return attempt;
      },
      { timeout: 60_000 },
    );
    await finishAudit(attempt.id, "user.deleted");
    refreshUsers(id);
    return { id };
  },
);
