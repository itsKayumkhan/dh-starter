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

async function userIdForCustomer(customer: string | { id: string } | null | undefined) {
  const id = stripeId(customer);
  if (!id) throw new Error("Stripe customer is missing");
  const record = await db.billingCustomer.findUnique({ where: { stripeCustomerId: id } });
  if (!record) throw new Error("Stripe customer has no local owner");
  return record.userId;
}

async function storeSubscription(subscription: Stripe.Subscription) {
  const userId = await userIdForCustomer(subscription.customer);
  const item = subscription.items.data[0];
  if (!item) throw new Error("Subscription item is missing");
  const periodEnd = item.current_period_end ?? subscription.cancel_at ?? subscription.ended_at;
  if (!periodEnd) throw new Error("Subscription period end is missing");
  const priceId = item.price.id;
  await db.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      stripeSubscriptionId: subscription.id, userId, status: subscription.status,
      priceId, planId: planIdFromPrice(priceId), currentPeriodEnd: new Date(periodEnd * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      userId, status: subscription.status, priceId, planId: planIdFromPrice(priceId),
      currentPeriodEnd: new Date(periodEnd * 1000), cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function storePaymentIntent(intent: Stripe.PaymentIntent, status: "succeeded" | "failed" | "processing") {
  const userId = await userIdForCustomer(intent.customer);
  const previous = await db.payment.findUnique({
    where: { stripePaymentIntentId: intent.id }, select: { status: true },
  });
  const finalStatus = previous && ["refunded", "partially_refunded"].includes(previous.status)
    ? previous.status
    : previous?.status === "succeeded" && status !== "succeeded"
      ? "succeeded"
      : status;
  const data = {
    userId, amount: status === "succeeded" ? intent.amount_received : intent.amount,
    currency: intent.currency, status: finalStatus, description: intent.description,
  };
  await db.payment.upsert({
    where: { stripePaymentIntentId: intent.id },
    create: { stripePaymentIntentId: intent.id, ...data },
    update: data,
  });
}

async function handleCheckout(session: Stripe.Checkout.Session) {
  const userId = await userIdForCustomer(session.customer);
  if (session.client_reference_id !== userId) throw new Error("Checkout customer mismatch");
  if (session.mode === "subscription") {
    const id = stripeId(session.subscription);
    if (!id) throw new Error("Checkout subscription is missing");
    await storeSubscription(await getStripe().subscriptions.retrieve(id));
    return;
  }
  if (session.mode === "payment") {
    const intentId = stripeId(session.payment_intent);
    if (intentId) {
      const intent = await getStripe().paymentIntents.retrieve(intentId);
      const status = intent.status === "succeeded" ? "succeeded"
        : intent.status === "requires_payment_method" || intent.status === "canceled" ? "failed" : "processing";
      await storePaymentIntent(intent, status);
      await db.payment.update({
        where: { stripePaymentIntentId: intentId },
        data: { stripeCheckoutSessionId: session.id },
      });
    } else if (session.amount_total !== null && session.currency) {
      await db.payment.upsert({
        where: { stripeCheckoutSessionId: session.id },
        create: {
          stripeCheckoutSessionId: session.id, userId, amount: session.amount_total,
          currency: session.currency, status: session.payment_status, description: "One-time checkout",
        },
        update: { status: session.payment_status },
      });
    }
  }
}

async function handleInvoice(invoice: Stripe.Invoice) {
  await userIdForCustomer(invoice.customer);
  const subscriptionId = stripeId(invoice.parent?.subscription_details?.subscription);
  if (subscriptionId) await storeSubscription(await getStripe().subscriptions.retrieve(subscriptionId));
}

async function handleRefund(charge: Stripe.Charge) {
  const userId = await userIdForCustomer(charge.customer);
  const intentId = stripeId(charge.payment_intent);
  if (!intentId) throw new Error("Refund payment intent is missing");
  const result = await db.payment.updateMany({
    where: { stripePaymentIntentId: intentId, userId },
    data: { status: charge.amount_refunded >= charge.amount ? "refunded" : "partially_refunded" },
  });
  if (result.count !== 1) throw new Error("Refund payment is missing");
}

export async function handleBillingEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckout(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await storeSubscription(event.data.object as Stripe.Subscription);
      break;
    case "invoice.paid":
    case "invoice.payment_failed":
      await handleInvoice(event.data.object as Stripe.Invoice);
      break;
    case "payment_intent.succeeded":
      await storePaymentIntent(event.data.object as Stripe.PaymentIntent, "succeeded");
      break;
    case "payment_intent.payment_failed":
      await storePaymentIntent(event.data.object as Stripe.PaymentIntent, "failed");
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
