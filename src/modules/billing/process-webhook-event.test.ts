import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import {
  processWebhookEvent,
  type WebhookDependencies,
} from "@/modules/billing/server/process-webhook-event";

const event = {
  id: "evt_test_1",
  type: "payment_intent.succeeded",
} as Stripe.Event;

function fakes(): WebhookDependencies {
  return {
    claim: vi
      .fn()
      .mockResolvedValue({
        state: "claimed",
        claimedAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    handle: vi.fn().mockResolvedValue(undefined),
    markProcessed: vi.fn().mockResolvedValue(undefined),
    markFailed: vi.fn().mockResolvedValue(undefined),
  };
}

describe("processWebhookEvent", () => {
  it("processes a claimed event exactly once", async () => {
    const deps = fakes();
    await expect(processWebhookEvent(event, deps)).resolves.toBe("processed");
    expect(deps.handle).toHaveBeenCalledExactlyOnceWith(event);
    expect(deps.markProcessed).toHaveBeenCalledExactlyOnceWith(
      event.id,
      new Date("2026-01-01T00:00:00.000Z"),
    );
    expect(deps.markFailed).not.toHaveBeenCalled();
  });

  it("acknowledges an already processed event", async () => {
    const deps = fakes();
    vi.mocked(deps.claim).mockResolvedValue({ state: "processed" });
    await expect(processWebhookEvent(event, deps)).resolves.toBe("duplicate");
    expect(deps.handle).not.toHaveBeenCalled();
    expect(deps.markProcessed).not.toHaveBeenCalled();
  });

  it("requires Stripe to retry an in-progress claim", async () => {
    const deps = fakes();
    vi.mocked(deps.claim).mockResolvedValue({ state: "processing" });
    await expect(processWebhookEvent(event, deps)).resolves.toBe("processing");
    expect(deps.handle).not.toHaveBeenCalled();
    expect(deps.markProcessed).not.toHaveBeenCalled();
  });

  it("marks a failed attempt for retry and processes the next claim", async () => {
    const deps = fakes();
    const failure = new Error("temporary database failure");
    vi.mocked(deps.handle).mockRejectedValueOnce(failure);
    await expect(processWebhookEvent(event, deps)).rejects.toThrow(
      "temporary database failure",
    );
    expect(deps.markFailed).toHaveBeenCalledWith(
      event.id,
      expect.any(Date),
      "Error: temporary database failure",
    );
    await expect(processWebhookEvent(event, deps)).resolves.toBe("processed");
    expect(deps.handle).toHaveBeenCalledTimes(2);
  });

  it("fails closed if recording success fails", async () => {
    const deps = fakes();
    vi.mocked(deps.markProcessed).mockRejectedValueOnce(
      new Error("write failed"),
    );
    await expect(processWebhookEvent(event, deps)).rejects.toThrow(
      "write failed",
    );
    expect(deps.markFailed).toHaveBeenCalledOnce();
  });
});
