import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  attempt: null as null | {
    userId: string;
    attemptId: string;
    priceId: string;
    stripeSessionId: string | null;
    url: string | null;
    createdAt: Date;
  },
  createKeys: [] as string[],
  remoteStatus: "none" as "none" | "active",
}));

vi.mock("@/lib/db", () => ({
  db: {
    subscription: { findFirst: vi.fn().mockResolvedValue(null) },
    subscriptionCheckout: {
      findUnique: vi.fn(async () => state.attempt),
      create: vi.fn(
        async ({
          data,
        }: {
          data: { userId: string; attemptId: string; priceId: string };
        }) => {
          if (state.attempt) throw { code: "P2002" };
          state.attempt = {
            ...data,
            stripeSessionId: null,
            url: null,
            createdAt: new Date(),
          };
          return state.attempt;
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { attemptId: string; stripeSessionId?: null };
          data: { stripeSessionId?: string; url?: string };
        }) => {
          if (
            !state.attempt ||
            state.attempt.attemptId !== where.attemptId ||
            (where.stripeSessionId === null &&
              state.attempt.stripeSessionId !== null)
          )
            return { count: 0 };
          Object.assign(state.attempt, data);
          return { count: 1 };
        },
      ),
    },
  },
}));

vi.mock("@/modules/billing/server/stripe", () => ({
  getStripe: () => ({
    subscriptions: {
      list: async () => ({
        data: state.remoteStatus === "active" ? [{ status: "active" }] : [],
        has_more: false,
      }),
    },
    checkout: {
      sessions: {
        create: async (
          _params: unknown,
          options: { idempotencyKey: string },
        ) => {
          state.createKeys.push(options.idempotencyKey);
          await Promise.resolve();
          return { id: "cs_one", url: "https://checkout.stripe.com/one" };
        },
        retrieve: async () => ({
          status: "open",
          url: "https://checkout.stripe.com/one",
        }),
      },
    },
  }),
}));

import { createSubscriptionCheckout } from "@/modules/billing/server/subscription-checkout";

const input = {
  userId: "user_one",
  customerId: "cus_one",
  priceId: "price_one",
  planId: "starter",
  successUrl: "https://site.test/success",
  cancelUrl: "https://site.test/cancel",
  portalUrl: vi.fn(async () => "https://billing.stripe.com/portal"),
};

describe("subscription checkout reservation", () => {
  beforeEach(() => {
    state.attempt = null;
    state.createKeys = [];
    state.remoteStatus = "none";
    input.portalUrl.mockClear();
  });

  it("reuses one reservation and Stripe idempotency key across parallel requests", async () => {
    const urls = await Promise.all([
      createSubscriptionCheckout(input),
      createSubscriptionCheckout(input),
    ]);
    expect(urls).toEqual([
      "https://checkout.stripe.com/one",
      "https://checkout.stripe.com/one",
    ]);
    expect(new Set(state.createKeys).size).toBe(1);
    expect(state.attempt?.stripeSessionId).toBe("cs_one");
  });

  it("opens the portal when Stripe has an active subscription absent from the database", async () => {
    state.remoteStatus = "active";
    await expect(createSubscriptionCheckout(input)).resolves.toBe(
      "https://billing.stripe.com/portal",
    );
    expect(state.createKeys).toHaveLength(0);
  });
});
