import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

const {
  assertUser,
  assertPermission,
  subscriptionFindMany,
  subscriptionFindFirst,
  subscriptionCount,
  paymentFindMany,
  paymentCount,
} = vi.hoisted(() => ({
  assertUser: vi.fn(),
  assertPermission: vi.fn(),
  subscriptionFindMany: vi.fn(),
  subscriptionFindFirst: vi.fn(),
  subscriptionCount: vi.fn(),
  paymentFindMany: vi.fn(),
  paymentCount: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ assertUser, assertPermission }));
vi.mock("@/lib/db", () => ({
  db: {
    subscription: {
      findMany: subscriptionFindMany,
      findFirst: subscriptionFindFirst,
      count: subscriptionCount,
    },
    payment: { findMany: paymentFindMany, count: paymentCount },
  },
}));

import {
  getAdminPayments,
  getAdminSubscriptions,
  getMyBillingOverview,
  hasManagedSubscription,
} from "@/modules/billing/server/queries";

const date = new Date("2026-01-02T03:04:05.000Z");
const subscription = {
  id: "sub-1",
  planId: "starter-monthly",
  status: "active",
  currentPeriodEnd: date,
  cancelAtPeriodEnd: false,
};
const payment = {
  id: "pay-1",
  amount: 1000,
  currency: "usd",
  status: "succeeded",
  description: "Setup",
  createdAt: date,
};

beforeEach(() => {
  vi.resetAllMocks();
  assertUser.mockResolvedValue({ id: "user-1" });
  assertPermission.mockResolvedValue({ id: "admin-1" });
  subscriptionFindMany.mockResolvedValue([]);
  subscriptionFindFirst.mockResolvedValue(null);
  subscriptionCount.mockResolvedValue(0);
  paymentFindMany.mockResolvedValue([]);
  paymentCount.mockResolvedValue(0);
});

describe("personal billing queries", () => {
  it("returns active subscriptions and recent payments scoped to the caller", async () => {
    subscriptionFindMany.mockResolvedValue([subscription]);
    paymentFindMany.mockResolvedValue([payment]);
    await expect(getMyBillingOverview()).resolves.toEqual({
      subscription: { ...subscription, currentPeriodEnd: date.toISOString() },
      activeSubscriptions: [
        { ...subscription, currentPeriodEnd: date.toISOString() },
      ],
      payments: [{ ...payment, createdAt: date.toISOString() }],
    });
    expect(subscriptionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-1",
          status: { in: ["active", "trialing", "past_due"] },
        },
        orderBy: { createdAt: "desc" },
      }),
    );
    expect(paymentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        take: 20,
      }),
    );
    expect(subscriptionFindFirst).not.toHaveBeenCalled();
  });

  it("falls back to the latest inactive subscription and handles no records", async () => {
    subscriptionFindFirst.mockResolvedValueOnce({
      ...subscription,
      status: "canceled",
    });
    const previous = await getMyBillingOverview();
    expect(previous.subscription?.status).toBe("canceled");
    expect(subscriptionFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        orderBy: { createdAt: "desc" },
      }),
    );
    await expect(getMyBillingOverview()).resolves.toEqual({
      subscription: null,
      activeSubscriptions: [],
      payments: [],
    });
  });

  it("checks only the caller's managed subscription", async () => {
    subscriptionFindFirst.mockResolvedValueOnce({ id: "sub-1" });
    await expect(hasManagedSubscription()).resolves.toBe(true);
    await expect(hasManagedSubscription()).resolves.toBe(false);
    expect(subscriptionFindFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        status: { in: ["active", "trialing", "past_due"] },
      },
      select: { id: true },
    });
  });

  it("denies anonymous callers before querying", async () => {
    assertUser.mockRejectedValue(new UnauthorizedError());
    await expect(getMyBillingOverview()).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    await expect(hasManagedSubscription()).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(subscriptionFindMany).not.toHaveBeenCalled();
    expect(subscriptionFindFirst).not.toHaveBeenCalled();
    expect(paymentFindMany).not.toHaveBeenCalled();
  });

  it("propagates a database failure", async () => {
    subscriptionFindMany.mockRejectedValue(new Error("database unavailable"));
    await expect(getMyBillingOverview()).rejects.toThrow(
      "database unavailable",
    );
  });
});

describe("admin billing lists", () => {
  it("filters, sorts and paginates payments with serialized dates", async () => {
    paymentFindMany.mockResolvedValue([{ ...payment, userId: "user-1" }]);
    paymentCount.mockResolvedValue(101);
    await expect(
      getAdminPayments({
        page: "2",
        pageSize: "50",
        sort: "amount:asc",
        status: "succeeded",
        q: "  USER  ",
      }),
    ).resolves.toEqual({
      data: [{ ...payment, userId: "user-1", createdAt: date.toISOString() }],
      pageCount: 3,
    });
    const where = {
      status: "succeeded",
      OR: [
        { userId: { contains: "USER", mode: "insensitive" } },
        { description: { contains: "USER", mode: "insensitive" } },
      ],
    };
    expect(paymentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
        skip: 50,
        take: 50,
        orderBy: { amount: "asc" },
      }),
    );
    expect(paymentCount).toHaveBeenCalledWith({ where });
    expect(assertPermission).toHaveBeenCalledWith("billing:manage");
  });

  it("bounds invalid pagination and ignores invalid filters and sort", async () => {
    await expect(
      getAdminPayments({
        page: "-5",
        pageSize: "999",
        sort: "userId:asc",
        status: "bogus",
      }),
    ).resolves.toEqual({ data: [], pageCount: 0 });
    expect(paymentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("filters and paginates subscriptions with serialized dates", async () => {
    subscriptionFindMany.mockResolvedValue([
      { ...subscription, userId: "user-1", createdAt: date },
    ]);
    subscriptionCount.mockResolvedValue(11);
    await expect(
      getAdminSubscriptions({
        page: "2",
        pageSize: "10",
        sort: "currentPeriodEnd:asc",
        status: "active",
        q: "starter",
      }),
    ).resolves.toEqual({
      data: [
        {
          ...subscription,
          userId: "user-1",
          createdAt: date.toISOString(),
          currentPeriodEnd: date.toISOString(),
        },
      ],
      pageCount: 2,
    });
    const where = {
      status: "active",
      OR: [
        { userId: { contains: "starter", mode: "insensitive" } },
        { planId: { contains: "starter", mode: "insensitive" } },
      ],
    };
    expect(subscriptionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
        skip: 10,
        take: 10,
        orderBy: { currentPeriodEnd: "asc" },
      }),
    );
    expect(subscriptionCount).toHaveBeenCalledWith({ where });
  });

  it("returns empty subscriptions with safe default bounds", async () => {
    await expect(
      getAdminSubscriptions({ page: "0", pageSize: "0", status: "unknown" }),
    ).resolves.toEqual({ data: [], pageCount: 0 });
    expect(subscriptionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("denies callers without permission before database access", async () => {
    assertPermission.mockRejectedValue(new ForbiddenError());
    await expect(getAdminPayments({})).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getAdminSubscriptions({})).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(paymentFindMany).not.toHaveBeenCalled();
    expect(subscriptionFindMany).not.toHaveBeenCalled();
  });

  it("propagates a database failure", async () => {
    paymentFindMany.mockRejectedValue(new Error("database unavailable"));
    await expect(getAdminPayments({})).rejects.toThrow("database unavailable");
  });
});
