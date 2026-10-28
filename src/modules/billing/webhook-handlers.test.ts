import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const state = vi.hoisted(() => ({
  remoteStatus: "canceled" as "canceled" | "active",
  storedSubscription: "none" as "none" | "canceled" | "active",
  paymentStatus: "succeeded" as string,
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/modules/billing/server/stripe", () => ({
  getStripe: () => ({
    subscriptions: {
      retrieve: async () => ({
        id: "sub_one",
        customer: "cus_one",
        status: state.remoteStatus,
        items: {
          data: [
            { price: { id: "price_one" }, current_period_end: 1900000000 },
          ],
        },
        cancel_at_period_end: false,
      }),
    },
  }),
}));
vi.mock("@/lib/db", () => ({
  db: {
    billingCustomer: { findUnique: async () => ({ userId: "user_one" }) },
    $transaction: async (callback: (tx: unknown) => Promise<void>) =>
      callback({
        $queryRaw: async () => [{ locked: 1 }],
        billingCustomer: { findUnique: async () => ({ userId: "user_one" }) },
        subscription: {
          upsert: async ({
            update,
          }: {
            update: { status: "active" | "canceled" };
          }) => {
            state.storedSubscription = update.status;
          },
        },
      }),
    payment: {
      updateMany: async ({
        where,
        data,
      }: {
        where: { status?: { notIn?: string[]; not?: string } };
        data: { status: string };
      }) => {
        await Promise.resolve();
        if (
          where.status?.notIn?.includes(state.paymentStatus) ||
          where.status?.not === state.paymentStatus
        )
          return { count: 0 };
        state.paymentStatus = data.status;
        return { count: 1 };
      },
      create: async () => {
        throw { code: "P2002" };
      },
      findFirst: async () => ({ status: state.paymentStatus }),
    },
  },
}));

import { handleBillingEvent } from "@/modules/billing/server/webhook-handlers";

function event(type: string, object: object): Stripe.Event {
  return { type, data: { object } } as Stripe.Event;
}

describe("billing webhook state transitions", () => {
  beforeEach(() => {
    state.remoteStatus = "canceled";
    state.storedSubscription = "none";
    state.paymentStatus = "succeeded";
  });

  it("stores current Stripe state when an older active event arrives after cancellation", async () => {
    await handleBillingEvent(
      event("customer.subscription.deleted", {
        id: "sub_one",
        status: "canceled",
      }),
    );
    await handleBillingEvent(
      event("customer.subscription.updated", {
        id: "sub_one",
        status: "active",
      }),
    );
    expect(state.storedSubscription).toBe("canceled");
  });

  it("never lets a concurrent payment event overwrite a full refund", async () => {
    await Promise.all([
      handleBillingEvent(
        event("payment_intent.succeeded", {
          id: "pi_one",
          customer: "cus_one",
          amount: 1000,
          amount_received: 1000,
          currency: "usd",
          description: null,
        }),
      ),
      handleBillingEvent(
        event("charge.refunded", {
          customer: "cus_one",
          payment_intent: "pi_one",
          amount: 1000,
          amount_refunded: 1000,
        }),
      ),
    ]);
    expect(state.paymentStatus).toBe("refunded");
  });

  it("does not reduce a full refund to a partial refund", async () => {
    state.paymentStatus = "refunded";
    await handleBillingEvent(
      event("charge.refunded", {
        customer: "cus_one",
        payment_intent: "pi_one",
        amount: 1000,
        amount_refunded: 500,
      }),
    );
    expect(state.paymentStatus).toBe("refunded");
  });
});
