import type Stripe from "stripe";

export type WebhookDependencies = {
  claim: (event: Stripe.Event) => Promise<Date | null>;
  handle: (event: Stripe.Event) => Promise<void>;
  markProcessed: (id: string, claimedAt: Date) => Promise<void>;
  markFailed: (id: string, claimedAt: Date, error: string) => Promise<void>;
};

export async function processWebhookEvent(event: Stripe.Event, deps: WebhookDependencies) {
  const claimedAt = await deps.claim(event);
  if (!claimedAt) return "duplicate" as const;
  try {
    await deps.handle(event);
    await deps.markProcessed(event.id, claimedAt);
    return "processed" as const;
  } catch (error) {
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown webhook error";
    await deps.markFailed(event.id, claimedAt, reason.slice(0, 1000));
    throw error;
  }
}
