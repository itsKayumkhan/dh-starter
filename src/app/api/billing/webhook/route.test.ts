import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_WEBHOOK_BODY_BYTES } from "@/modules/billing/server/webhook-body";

const fakes = vi.hoisted(() => ({
  constructEvent: vi.fn(() => ({
    id: "evt_one",
    type: "payment_intent.succeeded",
  })),
  process: vi.fn(async () => "processing"),
}));

vi.mock("@/modules/billing/env", () => ({
  getBillingEnv: () => ({ STRIPE_WEBHOOK_SECRET: "whsec_test" }),
}));
vi.mock("@/modules/billing/server/stripe", () => ({
  getStripe: () => ({ webhooks: { constructEvent: fakes.constructEvent } }),
}));
vi.mock("@/modules/billing/server/process-webhook-event", () => ({
  processWebhookEvent: fakes.process,
}));
vi.mock("@/modules/billing/server/webhook-store", () => ({ webhookStore: {} }));
vi.mock("@/modules/billing/server/webhook-handlers", () => ({
  handleBillingEvent: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));

import { POST } from "@/app/api/billing/webhook/route";

describe("billing webhook route", () => {
  beforeEach(() => {
    fakes.constructEvent.mockClear();
    fakes.process.mockClear();
  });

  it("returns a retryable response while the event is still processing", async () => {
    const response = await POST(
      new Request("https://site.test/api/billing/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      }),
    );
    expect(response.status).toBe(503);
  });

  it("rejects oversized input before signature verification", async () => {
    const response = await POST(
      new Request("https://site.test/api/billing/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: new Uint8Array(MAX_WEBHOOK_BODY_BYTES + 1),
      }),
    );
    expect(response.status).toBe(413);
    expect(fakes.constructEvent).not.toHaveBeenCalled();
  });
});
