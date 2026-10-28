import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { ConflictError } from "@/lib/errors";
import { getStripe } from "@/modules/billing/server/stripe";

type CheckoutRequest = {
  userId: string;
  customerId: string;
  priceId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
  portalUrl: () => Promise<string>;
};

const managedStatuses = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "paused",
]);
const MAX_ATTEMPT_AGE_MS = 23 * 60 * 60 * 1000;

function isUniqueConstraint(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function hasStripeSubscription(customerId: string) {
  const subscriptions = await getStripe().subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  });
  if (
    subscriptions.data.some((subscription) =>
      managedStatuses.has(subscription.status),
    )
  )
    return true;
  if (subscriptions.has_more) throw new ConflictError();
  return false;
}

export async function createSubscriptionCheckout(
  input: CheckoutRequest,
): Promise<string> {
  const stripe = getStripe();
  for (let tries = 0; tries < 4; tries++) {
    if (
      (await db.subscription.findFirst({
        where: { userId: input.userId, status: { in: [...managedStatuses] } },
        select: { id: true },
      })) ||
      (await hasStripeSubscription(input.customerId))
    )
      return input.portalUrl();

    let attempt = await db.subscriptionCheckout.findUnique({
      where: { userId: input.userId },
    });
    if (!attempt) {
      try {
        attempt = await db.subscriptionCheckout.create({
          data: {
            userId: input.userId,
            attemptId: randomUUID(),
            priceId: input.priceId,
          },
        });
      } catch (error) {
        if (!isUniqueConstraint(error)) throw error;
        continue;
      }
    }

    if (attempt.stripeSessionId) {
      const session = await stripe.checkout.sessions.retrieve(
        attempt.stripeSessionId,
      );
      if (session.status === "open") {
        if (!session.url) throw new ConflictError();
        return session.url;
      }
      if (session.status === "complete") {
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (!subscriptionId) throw new ConflictError();
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        if (managedStatuses.has(subscription.status)) return input.portalUrl();
      }
      if (session.status !== "expired" && session.status !== "complete")
        throw new ConflictError();
      const replaced = await db.subscriptionCheckout.updateMany({
        where: { userId: input.userId, attemptId: attempt.attemptId },
        data: {
          attemptId: randomUUID(),
          priceId: input.priceId,
          stripeSessionId: null,
          url: null,
          createdAt: new Date(),
        },
      });
      if (replaced.count !== 1) continue;
      continue;
    }

    if (
      attempt.priceId !== input.priceId ||
      Date.now() - attempt.createdAt.getTime() > MAX_ATTEMPT_AGE_MS
    )
      throw new ConflictError();
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: input.customerId,
        client_reference_id: input.userId,
        line_items: [{ price: input.priceId, quantity: 1 }],
        metadata: { userId: input.userId, planId: input.planId },
        subscription_data: {
          metadata: { userId: input.userId, planId: input.planId },
        },
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      },
      { idempotencyKey: `subscription-checkout:${attempt.attemptId}` },
    );
    if (!session.url) throw new ConflictError();
    const saved = await db.subscriptionCheckout.updateMany({
      where: {
        userId: input.userId,
        attemptId: attempt.attemptId,
        stripeSessionId: null,
      },
      data: { stripeSessionId: session.id, url: session.url },
    });
    if (saved.count !== 1) {
      const current = await db.subscriptionCheckout.findUnique({
        where: { userId: input.userId },
      });
      if (
        current?.attemptId === attempt.attemptId &&
        current.stripeSessionId === session.id &&
        current.url
      )
        return current.url;
      throw new ConflictError();
    }
    return session.url;
  }
  throw new ConflictError();
}
