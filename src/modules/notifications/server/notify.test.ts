import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  createManyAndReturn: vi.fn(),
  sendEmail: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    user: { findMany: mocks.findMany },
    notification: { createManyAndReturn: mocks.createManyAndReturn },
  },
}));
vi.mock("@/lib/email", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/content/settings", () => ({
  getSiteSettings: async () => ({ url: "https://example.com" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { notify } from "./notify";

describe("idempotent notification delivery", () => {
  beforeEach(() => {
    mocks.findMany.mockReset();
    mocks.createManyAndReturn.mockReset();
    mocks.sendEmail.mockReset();
  });

  it("does not insert or email recipients twice on broadcast retry", async () => {
    const inserted = new Set<string>();
    mocks.findMany.mockResolvedValue([
      { id: "user-1", email: "one@example.com" },
      { id: "user-2", email: "two@example.com" },
    ]);
    mocks.createManyAndReturn.mockImplementation(
      async ({
        data,
      }: {
        data: Array<{ broadcastId: string; userId: string }>;
      }) =>
        data
          .filter((row) => {
            const key = `${row.broadcastId}:${row.userId}`;
            if (inserted.has(key)) return false;
            inserted.add(key);
            return true;
          })
          .map(({ userId }) => ({ userId })),
    );
    mocks.sendEmail.mockResolvedValue(undefined);
    const ids = ["user-1", "user-2"];
    const message = { type: "admin", title: "Update", body: "News" };
    const options = {
      broadcastId: "376aef70-f63a-47f9-9228-6cb84c36dcbf",
      email: true,
    };
    expect(await notify(ids, message, options)).toEqual({
      created: 2,
      emailed: 2,
      emailFailed: 0,
    });
    expect(await notify(ids, message, options)).toEqual({
      created: 0,
      emailed: 0,
      emailFailed: 0,
    });
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
    expect(mocks.createManyAndReturn).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
  });
});
