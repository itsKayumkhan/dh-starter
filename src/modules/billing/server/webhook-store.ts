import "server-only";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import type { WebhookDependencies } from "@/modules/billing/server/process-webhook-event";

const STALE_AFTER_MS = 5 * 60 * 1000;

function isUniqueConstraint(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export const webhookStore: Pick<WebhookDependencies, "claim" | "markProcessed" | "markFailed"> = {
  async claim(event: Stripe.Event) {
    const now = new Date();
    try {
      await db.webhookEvent.create({
        data: { id: event.id, type: event.type, status: "processing", attempts: 1, receivedAt: now },
      });
      return now;
    } catch (error) {
      if (!isUniqueConstraint(error)) throw error;
    }

    const result = await db.webhookEvent.updateMany({
      where: {
        id: event.id,
        type: event.type,
        OR: [
          { status: "failed" },
          { status: "processing", receivedAt: { lte: new Date(now.getTime() - STALE_AFTER_MS) } },
        ],
      },
      data: { status: "processing", attempts: { increment: 1 }, lastError: null, receivedAt: now, processedAt: null },
    });
    return result.count === 1 ? now : null;
  },
  async markProcessed(id, claimedAt) {
    const result = await db.webhookEvent.updateMany({
      where: { id, status: "processing", receivedAt: claimedAt },
      data: { status: "processed", processedAt: new Date(), lastError: null },
    });
    if (result.count !== 1) throw new Error("Webhook claim expired before completion");
  },
  async markFailed(id, claimedAt, error) {
    await db.webhookEvent.updateMany({
      where: { id, status: "processing", receivedAt: claimedAt },
      data: { status: "failed", lastError: error },
    });
  },
};
