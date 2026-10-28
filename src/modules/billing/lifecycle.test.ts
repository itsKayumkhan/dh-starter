import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  configured: true,
  localIds: ["sub_one"] as string[],
  canceled: false,
  cancelFails: false,
  checkoutId: null as string | null,
  expired: false,
  hasCustomer: true,
}));

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/modules/billing/env", () => ({
  getBillingEnv: () => {
    if (!state.configured) throw new Error("missing Stripe config");
    return {
      STRIPE_SECRET_KEY: "sk_test",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
    };
  },
}));
vi.mock("@/lib/db", () => ({
  db: {
    billingCustomer: {
      findUnique: async () =>
        state.hasCustomer ? { stripeCustomerId: "cus_one" } : null,
    },
    subscriptionCheckout: {
      findUnique: async () =>
        state.checkoutId ? { stripeSessionId: state.checkoutId } : null,
    },
    subscription: {
      findMany: async () =>
        state.localIds.map((stripeSubscriptionId) => ({
          stripeSubscriptionId,
        })),
      updateMany: async () => ({ count: 1 }),
    },
  },
}));
vi.mock("@/modules/billing/server/stripe", () => ({
  getStripe: () => ({
    subscriptions: {
      list: () => ({
        async *[Symbol.asyncIterator]() {
          yield { id: "sub_one", status: "active" };
        },
      }),
      retrieve: async () => ({
        status: state.canceled ? "canceled" : "active",
      }),
      cancel: async () => {
        if (state.cancelFails) throw new Error("Stripe unavailable");
        state.canceled = true;
        return { status: "canceled" };
      },
    },
    checkout: {
      sessions: {
        retrieve: async () => ({ id: "cs_one", status: "open" }),
        expire: async () => {
          state.expired = true;
          return { status: "expired" };
        },
      },
    },
  }),
}));

import { onUserDelete } from "@/modules/billing/lifecycle";

describe("billing account deletion hook", () => {
  beforeEach(() => {
    state.configured = true;
    state.localIds = ["sub_one"];
    state.canceled = false;
    state.cancelFails = false;
    state.checkoutId = null;
    state.expired = false;
    state.hasCustomer = true;
  });

  it("cancels active Stripe billing before account deletion can continue", async () => {
    await onUserDelete("user_one");
    expect(state.canceled).toBe(true);
  });

  it("expires an open checkout before deleting the account", async () => {
    state.checkoutId = "cs_one";
    await onUserDelete("user_one");
    expect(state.expired).toBe(true);
    expect(state.canceled).toBe(true);
  });

  it("fails closed when Stripe cancellation fails", async () => {
    state.cancelFails = true;
    await expect(onUserDelete("user_one")).rejects.toThrow(
      "Billing cancellation failed",
    );
  });

  it("is a no-op without billing config when the user has no billing data", async () => {
    state.configured = false;
    state.localIds = [];
    state.hasCustomer = false;
    await expect(onUserDelete("user_one")).resolves.toBeUndefined();
  });

  it("fails closed without billing config when a Stripe customer exists", async () => {
    state.configured = false;
    state.localIds = [];
    await expect(onUserDelete("user_one")).rejects.toThrow(
      "Billing cancellation is unavailable",
    );
  });
});
