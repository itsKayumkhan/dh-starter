import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  deleteNotifications: vi.fn(),
  deleteBroadcasts: vi.fn(),
  updateBroadcast: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    notification: { deleteMany: mocks.deleteNotifications },
    notificationBroadcast: {
      findMany: mocks.findMany,
      deleteMany: mocks.deleteBroadcasts,
      update: mocks.updateBroadcast,
    },
    $transaction: mocks.transaction,
  },
}));

import { onUserDelete } from "./lifecycle";

describe("notification user deletion", () => {
  it("removes notifications and user IDs from broadcast snapshots", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "broadcast-1",
        recipientIds: ["deleted-user", "other-user"],
      },
    ]);
    mocks.deleteNotifications.mockReturnValue(Promise.resolve({ count: 3 }));
    mocks.deleteBroadcasts.mockReturnValue(Promise.resolve({ count: 0 }));
    mocks.updateBroadcast.mockReturnValue(
      Promise.resolve({ id: "broadcast-1" }),
    );
    mocks.transaction.mockImplementation(
      async (operations: Promise<unknown>[]) => Promise.all(operations),
    );

    await onUserDelete("deleted-user");

    expect(mocks.deleteNotifications).toHaveBeenCalledWith({
      where: { userId: "deleted-user" },
    });
    expect(mocks.deleteBroadcasts).toHaveBeenCalledWith({
      where: { actorId: "deleted-user" },
    });
    expect(mocks.updateBroadcast).toHaveBeenCalledWith({
      where: { id: "broadcast-1" },
      data: { recipientIds: ["other-user"] },
    });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });
});
