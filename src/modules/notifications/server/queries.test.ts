import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notificationCount: vi.fn(),
  notificationFindMany: vi.fn(),
  userFindMany: vi.fn(),
  userFindUnique: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    notification: {
      count: mocks.notificationCount,
      findMany: mocks.notificationFindMany,
    },
    user: { findMany: mocks.userFindMany, findUnique: mocks.userFindUnique },
  },
}));

import {
  getBroadcastRecipients,
  getNotificationSummary,
  getUnreadCount,
  listNotifications,
  userExists,
} from "./queries";

const createdAt = new Date("2026-10-28T09:00:00.000Z");
const readAt = new Date("2026-10-28T10:00:00.000Z");
const row = {
  id: "notification-1",
  type: "admin",
  title: "Update",
  body: "News",
  href: "/dashboard",
  readAt,
  createdAt,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.notificationCount.mockResolvedValue(2);
  mocks.notificationFindMany.mockResolvedValue([row]);
  mocks.userFindMany.mockResolvedValue([{ id: "user-1" }]);
  mocks.userFindUnique.mockResolvedValue({
    id: "user-1",
    banned: false,
    role: "user",
  });
});

describe("notification queries", () => {
  it("counts only unread rows owned by the supplied user", async () => {
    expect(await getUnreadCount("owner-1")).toBe(2);
    expect(mocks.notificationCount).toHaveBeenCalledWith({
      where: { userId: "owner-1", readAt: null },
    });
  });

  it("returns a scoped summary with serializable dates", async () => {
    expect(await getNotificationSummary("owner-1")).toEqual({
      unread: 2,
      latest: [
        {
          id: row.id,
          type: row.type,
          title: row.title,
          body: row.body,
          href: row.href,
          readAt: readAt.toISOString(),
          createdAt: createdAt.toISOString(),
        },
      ],
    });
    expect(mocks.notificationFindMany).toHaveBeenCalledWith({
      where: { userId: "owner-1" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        href: true,
        readAt: true,
        createdAt: true,
      },
    });
  });

  it("returns empty summary and list values without writing", async () => {
    mocks.notificationCount.mockResolvedValue(0);
    mocks.notificationFindMany.mockResolvedValue([]);
    expect(await getNotificationSummary("owner-1")).toEqual({
      unread: 0,
      latest: [],
    });
    expect(
      await listNotifications("owner-1", { skip: 0, take: 10, status: "all" }),
    ).toEqual({ items: [], total: 0 });
  });

  it.each([
    ["all", { userId: "owner-1" }],
    ["unread", { userId: "owner-1", readAt: null }],
    ["read", { userId: "owner-1", readAt: { not: null } }],
  ] as const)(
    "lists %s rows using the owner scope and pagination",
    async (status, where) => {
      const result = await listNotifications("owner-1", {
        skip: 20,
        take: 10,
        status,
      });
      expect(result).toMatchObject({
        total: 2,
        items: [{ id: "notification-1" }],
      });
      expect(mocks.notificationFindMany).toHaveBeenCalledWith({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: 20,
        take: 10,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          href: true,
          readAt: true,
          createdAt: true,
        },
      });
      expect(mocks.notificationCount).toHaveBeenCalledWith({ where });
    },
  );

  it("preserves null optional values in list DTOs", async () => {
    mocks.notificationFindMany.mockResolvedValue([
      { ...row, href: null, readAt: null },
    ]);
    const result = await listNotifications("owner-1", {
      skip: 0,
      take: 100,
      status: "all",
    });
    expect(result.items[0]).toMatchObject({ href: null, readAt: null });
  });

  it.each(["", "x".repeat(256), 42])(
    "rejects invalid user IDs before querying",
    async (userId) => {
      await expect(getUnreadCount(userId as string)).rejects.toThrow();
      await expect(getNotificationSummary(userId as string)).rejects.toThrow();
      await expect(userExists(userId as string)).rejects.toThrow();
      expect(mocks.notificationCount).not.toHaveBeenCalled();
      expect(mocks.notificationFindMany).not.toHaveBeenCalled();
      expect(mocks.userFindUnique).not.toHaveBeenCalled();
    },
  );

  it.each([
    { skip: -1, take: 10, status: "all" },
    { skip: 0, take: 0, status: "all" },
    { skip: 0, take: 101, status: "all" },
    { skip: 0.5, take: 10, status: "all" },
    { skip: 0, take: 10, status: "other" },
  ])(
    "rejects invalid pagination or filter options before querying",
    async (options) => {
      await expect(
        listNotifications(
          "owner-1",
          options as Parameters<typeof listNotifications>[1],
        ),
      ).rejects.toThrow();
      expect(mocks.notificationFindMany).not.toHaveBeenCalled();
      expect(mocks.notificationCount).not.toHaveBeenCalled();
    },
  );

  it("looks up a selected recipient and returns null for a missing one", async () => {
    expect(await userExists("user-1")).toEqual({
      id: "user-1",
      banned: false,
      role: "user",
    });
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { id: true, banned: true, role: true },
    });
    mocks.userFindUnique.mockResolvedValue(null);
    expect(await userExists("missing-1")).toBeNull();
  });

  it("selects active recipients in stable order with one overflow row", async () => {
    expect(await getBroadcastRecipients({ role: "staff", limit: 200 })).toEqual(
      [{ id: "user-1" }],
    );
    expect(mocks.userFindMany).toHaveBeenCalledWith({
      where: { banned: false, role: "staff" },
      orderBy: { id: "asc" },
      take: 201,
      select: { id: true },
    });
  });

  it("omits the role filter for an all-user broadcast", async () => {
    await getBroadcastRecipients({ limit: 5 });
    expect(mocks.userFindMany).toHaveBeenCalledWith({
      where: { banned: false },
      orderBy: { id: "asc" },
      take: 6,
      select: { id: true },
    });
  });

  it("propagates database failures to the server caller", async () => {
    mocks.notificationFindMany.mockRejectedValue(
      new Error("database unavailable"),
    );
    await expect(
      listNotifications("owner-1", { skip: 0, take: 10, status: "all" }),
    ).rejects.toThrow("database unavailable");
  });
});
