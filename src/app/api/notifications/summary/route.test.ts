import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertUser: vi.fn(),
  checkRateLimit: vi.fn(),
  getNotificationSummary: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ assertUser: mocks.assertUser }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock("@/modules/notifications/server/queries", () => ({
  getNotificationSummary: mocks.getNotificationSummary,
}));

import { GET } from "./route";

describe("notification summary polling", () => {
  beforeEach(() => {
    mocks.assertUser.mockReset();
    mocks.checkRateLimit.mockReset();
    mocks.getNotificationSummary.mockReset();
  });

  it("returns 429 before querying the summary when the user exceeds the limit", async () => {
    mocks.assertUser.mockResolvedValue({ id: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({
      allowed: false,
      resetAt: new Date(Date.now() + 60_000),
    });
    const response = await GET();
    expect(response.status).toBe(429);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith(
      "notifications:summary:user-1",
      120,
      3600,
    );
    expect(mocks.getNotificationSummary).not.toHaveBeenCalled();
  });
});
