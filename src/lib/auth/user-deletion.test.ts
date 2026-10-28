import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  billing: vi.fn(async () => undefined),
  notifications: vi.fn(async () => undefined),
  logger: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/config/module-lifecycle", () => ({
  userDeleteHooks: [mocks.billing, mocks.notifications],
}));
vi.mock("@/lib/logger", () => ({ logger: { error: mocks.logger } }));

import { runUserDeleteHooks } from "@/lib/auth/user-deletion";

describe("user deletion lifecycle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs billing and notifications cleanup before deletion proceeds", async () => {
    await runUserDeleteHooks("user-1");
    expect(mocks.billing).toHaveBeenCalledWith("user-1");
    expect(mocks.notifications).toHaveBeenCalledWith("user-1");
  });

  it("fails closed when billing cleanup fails", async () => {
    mocks.billing.mockRejectedValueOnce(new Error("billing failed"));
    await expect(runUserDeleteHooks("user-1")).rejects.toThrow(
      "billing failed",
    );
    expect(mocks.notifications).not.toHaveBeenCalled();
    expect(mocks.logger).toHaveBeenCalledOnce();
  });
});
