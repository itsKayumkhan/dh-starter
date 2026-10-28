import "server-only";
import { createElement } from "react";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { getServerEnv, isGoogleAuthEnabled } from "@/lib/env/server";
import { sendEmail } from "@/lib/email";
import { VerifyEmail } from "@/lib/email/templates/verify-email";
import { ResetPassword } from "@/lib/email/templates/reset-password";
import { DeleteAccountEmail } from "@/lib/auth/delete-account-email";
import { runUserDeleteHooks } from "@/lib/auth/user-deletion";
import { validateProfileUpdate } from "@/lib/auth/profile-validation";
import { APIError } from "better-auth/api";

const env = getServerEnv();
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  advanced: { useSecureCookies: env.NODE_ENV === "production" },
  database: prismaAdapter(db, { provider: "postgresql" }),
  user: {
    deleteUser: {
      enabled: true,
      async beforeDelete(user) {
        const record = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        if (!record || record.role === "admin")
          throw new APIError("FORBIDDEN", {
            message: "An admin account must be demoted before deletion.",
          });
        // Runs before Better Auth deletes sessions, accounts or the user row; a failure blocks deletion.
        await runUserDeleteHooks(user.id);
      },
      async sendDeleteAccountVerification({ user, url }) {
        await sendEmail({
          to: user.email,
          subject: "Confirm account deletion",
          react: createElement(DeleteAccountEmail, { name: user.name, url }),
        });
      },
    },
  },
  databaseHooks: {
    user: {
      update: { before: async (data) => validateProfileUpdate(data) },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        react: createElement(ResetPassword, { name: user.name, url }),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        react: createElement(VerifyEmail, { name: user.name, url }),
      });
    },
  },
  socialProviders: isGoogleAuthEnabled()
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID ?? "",
          clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
        },
      }
    : {},
  rateLimit: { enabled: true, storage: "database" },
  plugins: [
    admin({ defaultRole: "user", adminRoles: ["admin"] }),
    nextCookies(),
  ],
});
