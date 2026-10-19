import { getBillingEnv } from "@/modules/billing/env";
import { getStripe } from "@/modules/billing/server/stripe";
import { processWebhookEvent } from "@/modules/billing/server/process-webhook-event";
import { webhookStore } from "@/modules/billing/server/webhook-store";
import { handleBillingEvent } from "@/modules/billing/server/webhook-handlers";
import { logger } from "@/lib/logger";


export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing Stripe signature", { status: 400 });

  let secret: string;
  try {
    secret = getBillingEnv().STRIPE_WEBHOOK_SECRET;
  } catch (error) {
    logger.error("Billing webhook configuration failed", { error });
    return new Response("Webhook unavailable", { status: 500 });
  }

  let event;
  try {
    const rawBody = await request.text();
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    logger.warn("Billing webhook signature rejected", { error });
    return new Response("Invalid Stripe signature", { status: 400 });
  }

  try {
    await processWebhookEvent(event, { ...webhookStore, handle: handleBillingEvent });
    return new Response("ok", { status: 200 });
  } catch (error) {
    logger.error("Billing webhook processing failed", { eventId: event.id, error });
    return new Response("Webhook processing failed", { status: 500 });
  }
}
