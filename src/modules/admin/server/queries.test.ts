import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUser, findAudit } = vi.hoisted(() => ({
  findUser: vi.fn(),
  findAudit: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: findUser },
    auditLog: { findMany: findAudit },
  },
}));

import { getUserDetail } from "@/modules/admin/server/queries";

beforeEach(() => {
  vi.clearAllMocks();
  findUser.mockResolvedValue(null);
});

describe("admin user detail", () => {
  it("selects at most 20 active sessions and counts only active sessions", async () => {
    await getUserDetail("target-1");

    const query = findUser.mock.calls[0][0];
    expect(query.select.sessions.take).toBe(20);
    expect(query.select.sessions.orderBy).toEqual({ updatedAt: "desc" });
    expect(query.select.sessions.where.expiresAt.gt).toBeInstanceOf(Date);
    expect(query.select._count.select.sessions.where.expiresAt.gt).toEqual(
      query.select.sessions.where.expiresAt.gt,
    );
    expect(findAudit).not.toHaveBeenCalled();
  });
});
