import "server-only";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { BILLING_ROUTES } from "@/modules/billing/routes";
import { planIdFromPrice } from "@/modules/billing/plans";
import { getStripe } from "@/modules/billing/server/stripe";

function stripeId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function userIdForCustomer(
  customer: string | { id: string } | null | undefined,
) {
  const id = stripeId(customer);
  if (!id) throw new Error("Stripe customer is missing");
  const record = await db.billingCustomer.findUnique({
    where: { stripeCustomerId: id },
  });
  if (!record) throw new Error("Stripe customer has no local owner");
  return record.userId;
}

async function storeSubscription(id: string) {
  await db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${id}, 0))`;
      const subscription = await getStripe().subscriptions.retrieve(id);
      const customerId = stripeId(subscription.customer);
      if (!customerId) throw new Error("Stripe customer is missing");
      const owner = await tx.billingCustomer.findUnique({
        where: { stripeCustomerId: customerId },
      });
      if (!owner) throw new Error("Stripe customer has no local owner");
      const item = subscription.items.data[0];
      if (!item) throw new Error("Subscription item is missing");
      const periodEnd =
        item.current_period_end ??
        subscription.cancel_at ??
        subscription.ended_at;
      if (!periodEnd) throw new Error("Subscription period end is missing");
      const priceId = item.price.id;
      const data = {
        userId: owner.userId,
        status: subscription.status,
        priceId,
        planId: planIdFromPrice(priceId),
        currentPeriodEnd: new Date(periodEnd * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
      await tx.subscription.upsert({
        where: { stripeSubscriptionId: id },
        create: { stripeSubscriptionId: id, ...data },
        update: data,
      });
    },
    { timeout: 20000 },
  );
}

async function storePaymentIntent(
  intent: Stripe.PaymentIntent,
  status: "succeeded" | "failed" | "processing",
) {
  const userId = await userIdForCustomer(intent.customer);
  const data = {
    userId,
    amount: status === "succeeded" ? intent.amount_received : intent.amount,
    currency: intent.currency,
    status,
    description: intent.description,
  };
  const allowed =
    status === "succeeded"
      ? ["refunded", "partially_refunded"]
      : ["refunded", "partially_refunded", "succeeded"];
  const result = await db.payment.updateMany({
    where: { stripePaymentIntentId: intent.id, status: { notIn: allowed } },
    data,
  });
  if (result.count) return;
  try {
    await db.payment.create({
      data: { stripePaymentIntentId: intent.id, ...data },
    });
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== "P2002"
    )
      throw error;
    await db.payment.updateMany({
      where: { stripePaymentIntentId: intent.id, status: { notIn: allowed } },
      data,
    });
  }
}

async function handleCheckout(session: Stripe.Checkout.Session) {
  const userId = await userIdForCustomer(session.customer);
  if (session.client_reference_id !== userId)
    throw new Error("Checkout customer mismatch");
  if (session.mode === "subscription") {
    const id = stripeId(session.subscription);
    if (!id) throw new Error("Checkout subscription is missing");
    await storeSubscription(id);
    return;
  }
  if (session.mode === "payment") {
    const intentId = stripeId(session.payment_intent);
    if (intentId) {
      const intent = await getStripe().paymentIntents.retrieve(intentId);
      const status =
        intent.status === "succeeded"
          ? "succeeded"
          : intent.status === "requires_payment_method" ||
              intent.status === "canceled"
            ? "failed"
            : "processing";
      await storePaymentIntent(intent, status);
      await db.payment.update({
        where: { stripePaymentIntentId: intentId },
        data: { stripeCheckoutSessionId: session.id },
      });
    } else if (session.amount_total !== null && session.currency) {
      await db.payment.upsert({
        where: { stripeCheckoutSessionId: session.id },
        create: {
          stripeCheckoutSessionId: session.id,
          userId,
          amount: session.amount_total,
          currency: session.currency,
          status: session.payment_status,
          description: "One-time checkout",
        },
        update: { status: session.payment_status },
      });
    }
  }
}

async function handleInvoice(invoice: Stripe.Invoice) {
  await userIdForCustomer(invoice.customer);
  const subscriptionId = stripeId(
    invoice.parent?.subscription_details?.subscription,
  );
  if (subscriptionId) await storeSubscription(subscriptionId);
}

async function handleRefund(charge: Stripe.Charge) {
  const userId = await userIdForCustomer(charge.customer);
  const intentId = stripeId(charge.payment_intent);
  if (!intentId) throw new Error("Refund payment intent is missing");
  const result = await db.payment.updateMany({
    where: {
      stripePaymentIntentId: intentId,
      userId,
      ...(charge.amount_refunded >= charge.amount
        ? {}
        : { status: { not: "refunded" } }),
    },
    data: {
      status:
        charge.amount_refunded >= charge.amount
          ? "refunded"
          : "partially_refunded",
    },
  });
  if (result.count !== 1) {
    const payment = await db.payment.findFirst({
      where: { stripePaymentIntentId: intentId, userId },
    });
    if (!payment || payment.status !== "refunded")
      throw new Error("Refund payment is missing");
  }
}

export async function handleBillingEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckout(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await storeSubscription((event.data.object as Stripe.Subscription).id);
      break;
    case "invoice.paid":
    case "invoice.payment_failed":
      await handleInvoice(event.data.object as Stripe.Invoice);
      break;
    case "payment_intent.succeeded":
      await storePaymentIntent(
        event.data.object as Stripe.PaymentIntent,
        "succeeded",
      );
      break;
    case "payment_intent.payment_failed":
      await storePaymentIntent(
        event.data.object as Stripe.PaymentIntent,
        "failed",
      );
      break;
    case "charge.refunded":
      await handleRefund(event.data.object as Stripe.Charge);
      break;
    default:
      return;
  }
  revalidatePath(BILLING_ROUTES.dashboard);
  revalidatePath(BILLING_ROUTES.admin);
}
