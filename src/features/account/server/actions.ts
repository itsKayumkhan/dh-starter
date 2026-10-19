"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getSession } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { safeAction } from "@/lib/safe-action";
import { AppError } from "@/lib/errors";
import { AUTH_ROUTES } from "@/components/auth/routes";
import {
  profileSchema,
  changePasswordSchema,
  deleteAccountSchema,
  revokeSessionSchema,
  emptySchema,
} from "@/features/account/schemas/account";

export const updateProfile = safeAction(
  {
    schema: profileSchema,
    auth: "user",
    rateLimit: { key: "account-profile", limit: 10, windowSec: 60 },
  },
  async (input) => {
    try {
      await auth.api.updateUser({
        headers: await headers(),
        body: { name: input.name, image: input.imageUrl || null },
      });
    } catch {
      throw new AppError("PROFILE_UPDATE", "Could not update your profile.");
    }
    revalidatePath(AUTH_ROUTES.account);
    return { name: input.name, imageUrl: input.imageUrl };
  },
);

export const changeAccountPassword = safeAction(
  {
    schema: changePasswordSchema,
    auth: "user",
    rateLimit: { key: "account-password", limit: 5, windowSec: 300 },
  },
  async (input) => {
    try {
      await auth.api.changePassword({
        headers: await headers(),
        body: {
          currentPassword: input.currentPassword,
          newPassword: input.newPassword,
          revokeOtherSessions: input.revokeOtherSessions,
        },
      });
    } catch {
      throw new AppError(
        "PASSWORD_CHANGE",
        "Could not change your password. Check your current password.",
      );
    }
    revalidatePath(AUTH_ROUTES.account);
    return { changed: true };
  },
);

export const revokeAccountSession = safeAction(
  {
    schema: revokeSessionSchema,
    auth: "user",
    rateLimit: { key: "account-revoke", limit: 10, windowSec: 60 },
  },
  async (input) => {
    const current = await getSession();
    if (!current || input.id === current.session.id)
      throw new AppError(
        "SESSION_REVOKE",
        "This session cannot be revoked here.",
      );
    try {
      const sessions = await auth.api.listSessions({
        headers: await headers(),
      });
      const target = sessions.find((session) => session.id === input.id);
      if (!target) throw new AppError("SESSION_MISSING", "Session not found.");
      await auth.api.revokeSession({
        headers: await headers(),
        body: { token: target.token },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("SESSION_REVOKE", "Could not revoke that session.");
    }
    revalidatePath(AUTH_ROUTES.account);
    return { revoked: true };
  },
);

export const revokeOtherAccountSessions = safeAction(
  {
    schema: emptySchema,
    auth: "user",
    rateLimit: { key: "account-revoke-all", limit: 5, windowSec: 300 },
  },
  async () => {
    try {
      await auth.api.revokeOtherSessions({ headers: await headers() });
    } catch {
      throw new AppError("SESSION_REVOKE", "Could not revoke other sessions.");
    }
    revalidatePath(AUTH_ROUTES.account);
    return { revoked: true };
  },
);

export const deleteAccount = safeAction(
  {
    schema: deleteAccountSchema,
    auth: "user",
    rateLimit: { key: "account-delete", limit: 3, windowSec: 600 },
  },
  async (input) => {
    try {
      const result = await auth.api.deleteUser({
        headers: await headers(),
        body: { password: input.password },
      });
      if (!result.success) throw new Error("Deletion was not completed");
    } catch {
      throw new AppError(
        "ACCOUNT_DELETE",
        "Could not delete your account. Check your password and try again.",
      );
    }
    revalidatePath(ROUTES.dashboard);
    return { deleted: true };
  },
);
