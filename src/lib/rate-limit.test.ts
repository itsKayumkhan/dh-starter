import { describe, expect, it, vi } from "vitest";

const { queryRaw, executeRaw } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  db: { $queryRaw: queryRaw, $executeRaw: executeRaw },
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { checkRateLimit } from "./rate-limit";

describe("expired rate limit cleanup", () => {
  it("deletes a bounded batch after an atomic count", async () => {
    queryRaw.mockResolvedValue([{ count: 1, resetAt: new Date() }]);
    executeRaw.mockResolvedValue(0);
    await expect(
      checkRateLimit("contact:unknown", 5, 60),
    ).resolves.toMatchObject({
      allowed: true,
    });
    const sql = executeRaw.mock.calls[0][0].join(" ");
    expect(sql).toContain('"resetAt" < NOW()');
    expect(sql).toContain("LIMIT 100");
    expect(sql).toContain("FOR UPDATE SKIP LOCKED");
  });
});
