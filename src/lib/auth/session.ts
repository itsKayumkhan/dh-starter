import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { connection } from "next/server";
import { forbidden, redirect, unstable_rethrow } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { can, type Permission, type Role } from "@/lib/auth/permissions";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { ROUTES } from "@/lib/constants/routes";

export const getSession = cache(async () => {
  try {
    // Session checks read the clock (expiry); mark this as request-time work for cacheComponents.
    await connection();
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user && !session.user.banned ? session : null;
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
});

function loginUrl(next: string) {
  return `${ROUTES.login}?next=${encodeURIComponent(next)}`;
}
export async function requireUser(next: string = ROUTES.dashboard) {
  const session = await getSession();
  if (!session) redirect(loginUrl(next));
  return session.user;
}
export async function assertUser() {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session.user;
}
export async function requireRole(roles: readonly Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role as Role)) forbidden();
  return user;
}
export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!can(user, permission)) forbidden();
  return user;
}
export async function assertPermission(permission: Permission) {
  const user = await assertUser();
  if (!can(user, permission)) throw new ForbiddenError();
  return user;
}
