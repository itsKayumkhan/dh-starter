import "server-only";
import { db } from "@/lib/db";
import { assertPermission, assertUser } from "@/lib/auth/session";
import { parseListParams, pageCount } from "@/lib/pagination";
import { z } from "zod";

type SearchParams = Record<string, string | string[] | undefined>;

export async function getMyBillingOverview() {
  const user = await assertUser();
  const [activeSubscriptions, payments] = await Promise.all([
    db.subscription.findMany({
      where: {
        userId: user.id,
        status: { in: ["active", "trialing", "past_due"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        planId: true,
        status: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    }),
    db.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        description: true,
        createdAt: true,
      },
    }),
  ]);
  const subscription =
    activeSubscriptions[0] ??
    (await db.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        planId: true,
        status: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    }));
  return {
    subscription: subscription
      ? {
          ...subscription,
          currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        }
      : null,
    activeSubscriptions: activeSubscriptions.map((item) => ({
      ...item,
      currentPeriodEnd: item.currentPeriodEnd.toISOString(),
    })),
    payments: payments.map((payment) => ({
      ...payment,
      createdAt: payment.createdAt.toISOString(),
    })),
  };
}

export async function hasManagedSubscription() {
  const user = await assertUser();
  return Boolean(
    await db.subscription.findFirst({
      where: {
        userId: user.id,
        status: { in: ["active", "trialing", "past_due"] },
      },
      select: { id: true },
    }),
  );
}

export async function getAdminPayments(searchParams: SearchParams) {
  await assertPermission("billing:manage");
  const params = parseListParams(searchParams, {
    sortable: ["createdAt", "amount", "status"] as const,
    filters: ["status"] as const,
    defaultSort: { field: "createdAt", dir: "desc" },
  });
  const status = z
    .enum([
      "succeeded",
      "failed",
      "processing",
      "paid",
      "refunded",
      "partially_refunded",
    ])
    .safeParse(params.filters.status);
  const where = {
    ...(status.success ? { status: status.data } : {}),
    ...(params.q
      ? {
          OR: [
            { userId: { contains: params.q, mode: "insensitive" as const } },
            {
              description: { contains: params.q, mode: "insensitive" as const },
            },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.payment.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { [params.sort.field]: params.sort.dir },
      select: {
        id: true,
        userId: true,
        amount: true,
        currency: true,
        status: true,
        description: true,
        createdAt: true,
      },
    }),
    db.payment.count({ where }),
  ]);
  return {
    data: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    pageCount: pageCount(total, params.pageSize),
  };
}

export async function getAdminSubscriptions(searchParams: SearchParams) {
  await assertPermission("billing:manage");
  const params = parseListParams(searchParams, {
    sortable: ["createdAt", "currentPeriodEnd", "status"] as const,
    filters: ["status"] as const,
    defaultSort: { field: "createdAt", dir: "desc" },
  });
  const status = z
    .enum([
      "active",
      "trialing",
      "past_due",
      "canceled",
      "unpaid",
      "incomplete",
      "incomplete_expired",
      "paused",
    ])
    .safeParse(params.filters.status);
  const where = {
    ...(status.success ? { status: status.data } : {}),
    ...(params.q
      ? {
          OR: [
            { userId: { contains: params.q, mode: "insensitive" as const } },
            { planId: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.subscription.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { [params.sort.field]: params.sort.dir },
      select: {
        id: true,
        userId: true,
        planId: true,
        status: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        createdAt: true,
      },
    }),
    db.subscription.count({ where }),
  ]);
  return {
    data: rows.map((row) => ({
      ...row,
      currentPeriodEnd: row.currentPeriodEnd.toISOString(),
      createdAt: row.createdAt.toISOString(),
    })),
    pageCount: pageCount(total, params.pageSize),
  };
}
