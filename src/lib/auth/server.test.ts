import { describe, expect, it, vi } from "vitest";
import type { BetterAuthOptions } from "better-auth";

const mocks = vi.hoisted(() => ({
  betterAuth: vi.fn((options: BetterAuthOptions) => ({ api: {}, options })),
  runUserDeleteHooks: vi.fn(async () => undefined),
  sendEmail: vi.fn(async () => ({ ok: true })),
  findUser: vi.fn(async () => ({ role: "user" })),
}));

vi.mock("server-only", () => ({}));
vi.mock("better-auth", () => ({ betterAuth: mocks.betterAuth }));
vi.mock("better-auth/api", () => ({
  APIError: class APIError extends Error {},
}));
vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: vi.fn(() => ({})),
}));
vi.mock("better-auth/plugins", () => ({ admin: vi.fn(() => ({})) }));
vi.mock("better-auth/next-js", () => ({ nextCookies: vi.fn(() => ({})) }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.findUser } } }));
vi.mock("@/lib/env/server", () => ({
  getServerEnv: () => ({
    NODE_ENV: "production",
    BETTER_AUTH_URL: "http://example.test",
    BETTER_AUTH_SECRET: "test-secret",
  }),
  isGoogleAuthEnabled: () => false,
}));
vi.mock("@/lib/email", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/email/templates/verify-email", () => ({
  VerifyEmail: () => null,
}));
vi.mock("@/lib/email/templates/reset-password", () => ({
  ResetPassword: () => null,
}));
vi.mock("@/lib/auth/delete-account-email", () => ({
  DeleteAccountEmail: () => null,
}));
vi.mock("@/lib/auth/user-deletion", () => ({
  runUserDeleteHooks: mocks.runUserDeleteHooks,
}));

import "@/lib/auth/server";

const config = mocks.betterAuth.mock.calls[0][0];

describe("Better Auth security configuration", () => {
  it("revokes all sessions after a password reset", () => {
    expect(config.emailAndPassword?.revokeSessionsOnPasswordReset).toBe(true);
  });

  it("uses Secure cookies in production even with an HTTP auth URL", () => {
    expect(config.advanced?.useSecureCookies).toBe(true);
  });

  it("runs module cleanup in beforeDelete, before Better Auth deletes sessions or the user", async () => {
    const beforeDelete = config.user?.deleteUser?.beforeDelete;
    expect(beforeDelete).toBeTypeOf("function");
    // Not a database hook: Better Auth deletes sessions and accounts before databaseHooks.user.delete runs.
    expect(config.databaseHooks?.user?.delete).toBeUndefined();
    await beforeDelete?.({ id: "user-1" } as Parameters<
      NonNullable<typeof beforeDelete>
    >[0]);
    expect(mocks.runUserDeleteHooks).toHaveBeenCalledWith("user-1");
  });

  it("blocks admin self deletion before cleanup", async () => {
    mocks.findUser.mockResolvedValueOnce({ role: "admin" });
    const user = {
      id: "admin-1",
      email: "admin@example.test",
      emailVerified: true,
      name: "Admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await expect(config.user?.deleteUser?.beforeDelete?.(user)).rejects.toThrow(
      "FORBIDDEN",
    );
  });

  it("requires a verification email for deletion", () => {
    expect(config.user?.deleteUser?.sendDeleteAccountVerification).toBeTypeOf(
      "function",
    );
  });

  it("validates raw Better Auth profile updates", async () => {
    const before = config.databaseHooks?.user?.update?.before;
    expect(before).toBeTypeOf("function");
    await expect(before?.({ name: "x" }, null)).rejects.toThrow();
    await expect(before?.({ name: "  Ada  " }, null)).resolves.toEqual({
      data: { name: "Ada" },
    });
  });
});
