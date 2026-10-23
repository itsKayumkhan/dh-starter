import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  forbidden: vi.fn(() => {
    throw new Error("NEXT_FORBIDDEN");
  }),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  rethrow: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/server", () => ({ connection: vi.fn(async () => undefined) }));
vi.mock("next/navigation", () => ({
  forbidden: mocks.forbidden,
  redirect: mocks.redirect,
  unstable_rethrow: mocks.rethrow,
}));
vi.mock("@/lib/auth/server", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

import {
  assertPermission,
  assertUser,
  requirePermission,
  requireRole,
} from "@/lib/auth/session";

describe("session guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: "user-1", role: "staff", banned: false },
    });
  });

  it("renders forbidden for a page role or permission denial", async () => {
    await expect(requireRole(["admin"])).rejects.toThrow("NEXT_FORBIDDEN");
    await expect(requirePermission("audit:read")).rejects.toThrow(
      "NEXT_FORBIDDEN",
    );
    expect(mocks.forbidden).toHaveBeenCalledTimes(2);
  });

  it("allows a matching page role and permission", async () => {
    await expect(requireRole(["staff", "admin"])).resolves.toMatchObject({
      id: "user-1",
    });
    await expect(requirePermission("users:read")).resolves.toMatchObject({
      id: "user-1",
    });
  });

  it("keeps action permission failures as AppErrors", async () => {
    await expect(assertPermission("audit:read")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(mocks.forbidden).not.toHaveBeenCalled();
  });

  it("fails closed for a banned or missing session", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "user-1", role: "admin", banned: true },
    });
    await expect(assertUser()).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(requireRole(["admin"])).rejects.toThrow("NEXT_REDIRECT");
  });
});
