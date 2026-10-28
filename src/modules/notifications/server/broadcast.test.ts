import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: { notificationBroadcast: mocks } }));

import {
  assertTargetAllowed,
  getOrCreateBroadcast,
  MAX_BROADCAST_RECIPIENTS,
} from "./broadcast";

const base = {
  broadcastId: "376aef70-f63a-47f9-9228-6cb84c36dcbf",
  target: "all" as const,
  title: "Update",
  body: "News",
  email: true,
};

describe("notification broadcast", () => {
  beforeEach(() => {
    mocks.findUnique.mockReset();
    mocks.create.mockReset();
  });

  it("caps the recipient snapshot before creating a broadcast", async () => {
    mocks.findUnique.mockResolvedValue(null);
    await expect(
      getOrCreateBroadcast(base, "admin-1", async () =>
        Array.from({ length: MAX_BROADCAST_RECIPIENTS + 1 }, (_, index) =>
          String(index),
        ),
      ),
    ).rejects.toThrow();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("reuses the persisted recipient snapshot on retry", async () => {
    let record: {
      id: string;
      actorId: string;
      payloadHash: string;
      recipientIds: string[];
    } | null = null;
    mocks.findUnique.mockImplementation(async () => record);
    mocks.create.mockImplementation(
      async ({ data }: { data: typeof record }) => {
        record = data;
        return data;
      },
    );
    const first = await getOrCreateBroadcast(base, "admin-1", async () => [
      "user-1",
      "user-2",
    ]);
    const retry = await getOrCreateBroadcast(base, "admin-1", async () => {
      throw new Error("Audience must not be queried again");
    });
    expect(first).toEqual({
      recipientIds: ["user-1", "user-2"],
      created: true,
    });
    expect(retry).toEqual({
      recipientIds: ["user-1", "user-2"],
      created: false,
    });
    await expect(
      getOrCreateBroadcast(
        { ...base, title: "Changed" },
        "admin-1",
        async () => [],
      ),
    ).rejects.toThrow();
  });

  it("rejects staff targeting admins or everyone", () => {
    const staff = { role: "staff", banned: false };
    expect(() => assertTargetAllowed(staff, base)).toThrow();
    expect(() =>
      assertTargetAllowed(staff, { ...base, target: "role", role: "admin" }),
    ).toThrow();
    expect(() =>
      assertTargetAllowed(
        staff,
        { ...base, target: "user", userId: "admin-1" },
        "admin",
      ),
    ).toThrow();
    expect(() =>
      assertTargetAllowed(
        staff,
        { ...base, target: "user", userId: "unknown-1" },
        "owner",
      ),
    ).toThrow();
    expect(() =>
      assertTargetAllowed(
        staff,
        { ...base, target: "user", userId: "user-1" },
        "user",
      ),
    ).not.toThrow();
  });
});
