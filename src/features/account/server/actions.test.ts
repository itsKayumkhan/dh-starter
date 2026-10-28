import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findAccount: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/server", () => ({
  auth: { api: { deleteUser: mocks.deleteUser } },
}));
vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/lib/db", () => ({
  db: { account: { findFirst: mocks.findAccount } },
}));
vi.mock("@/lib/safe-action", () => ({
  safeAction: (_options: unknown, handler: unknown) => handler,
}));

import { deleteAccount } from "@/features/account/server/actions";

describe("account deletion request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: "user-1", role: "user" },
    });
    mocks.deleteUser.mockResolvedValue({
      success: true,
      message: "Verification email sent",
    });
  });

  it("lets a Google-only user request verified deletion without a password", async () => {
    mocks.findAccount.mockResolvedValue(null);
    await expect(deleteAccount({ password: "" })).resolves.toEqual({
      verificationSent: true,
    });
    expect(mocks.deleteUser).toHaveBeenCalledWith(
      expect.objectContaining({ body: {} }),
    );
  });

  it("requires the password for a credential account", async () => {
    mocks.findAccount.mockResolvedValue({ password: "hashed" });
    await expect(deleteAccount({ password: "" })).rejects.toThrow(
      "Enter your password",
    );
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    await deleteAccount({ password: "correct" });
    expect(mocks.deleteUser).toHaveBeenCalledWith(
      expect.objectContaining({ body: { password: "correct" } }),
    );
  });

  it("blocks admin self deletion", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    });
    await expect(deleteAccount({ password: "secret" })).rejects.toThrow(
      "Demote this admin account",
    );
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
});
