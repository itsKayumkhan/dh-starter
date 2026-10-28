import "server-only";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getBillingEnv } from "@/modules/billing/env";
import { getStripe } from "@/modules/billing/server/stripe";

const terminalStatuses = new Set(["canceled", "incomplete_expired"]);

export async function onUserDelete(userId: string): Promise<void> {
  const [customer, localSubscriptions, checkout] = await Promise.all([
    db.billingCustomer.findUnique({
      where: { userId },
      select: { stripeCustomerId: true },
    }),
    db.subscription.findMany({
      where: { userId, status: { notIn: [...terminalStatuses] } },
      select: { stripeSubscriptionId: true },
    }),
    db.subscriptionCheckout.findUnique({
      where: { userId },
      select: { stripeSessionId: true },
    }),
  ]);

  try {
    getBillingEnv();
  } catch (error) {
    // No billing data at all: nothing to cancel. A known customer may still have a
    // remote subscription, so without Stripe access the deletion must stop.
    if (localSubscriptions.length === 0 && !checkout && !customer) return;
    logger.error("Billing cancellation unavailable during user deletion", {
      error,
    });
    throw new Error("Billing cancellation is unavailable");
  }

  const stripe = getStripe();
  const subscriptionIds = new Set(
    localSubscriptions.map((record) => record.stripeSubscriptionId),
  );
  if (checkout) {
    if (!checkout.stripeSessionId)
      throw new Error("Subscription checkout is still being created");
    const session = await stripe.checkout.sessions.retrieve(
      checkout.stripeSessionId,
    );
    if (session.status === "open") {
      const expired = await stripe.checkout.sessions.expire(session.id);
      if (expired.status !== "expired")
        throw new Error("Stripe did not confirm checkout expiration");
    }
    if (session.status === "complete") {
      const id =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (!id) throw new Error("Completed checkout has no subscription");
      subscriptionIds.add(id);
    }
    if (
      session.status !== "open" &&
      session.status !== "complete" &&
      session.status !== "expired"
    )
      throw new Error("Unknown checkout status during user deletion");
  }
  if (customer) {
    const remote = stripe.subscriptions.list({
      customer: customer.stripeCustomerId,
      status: "all",
      limit: 100,
    });
    for await (const subscription of remote) {
      if (!terminalStatuses.has(subscription.status))
        subscriptionIds.add(subscription.id);
    }
  }

  for (const id of subscriptionIds) {
    try {
      const current = await stripe.subscriptions.retrieve(id);
      if (!terminalStatuses.has(current.status)) {
        const canceled = await stripe.subscriptions.cancel(id);
        if (canceled.status !== "canceled")
          throw new Error("Stripe did not confirm cancellation");
      }
      await db.subscription.updateMany({
        where: { stripeSubscriptionId: id, userId },
        data: { status: "canceled", cancelAtPeriodEnd: false },
      });
    } catch (error) {
      logger.error("Billing cancellation failed during user deletion", {
        error,
      });
      throw new Error("Billing cancellation failed");
    }
  }
}
