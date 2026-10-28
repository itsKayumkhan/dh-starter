import { describe, expect, it } from "vitest";
import {
  MAX_WEBHOOK_BODY_BYTES,
  readWebhookBody,
  WebhookBodyTooLargeError,
} from "@/modules/billing/server/webhook-body";

describe("Stripe webhook body limit", () => {
  it("rejects a declared oversized body before reading it", async () => {
    const request = new Request("https://site.test/api/billing/webhook", {
      method: "POST",
      headers: { "content-length": String(MAX_WEBHOOK_BODY_BYTES + 1) },
      body: "x",
    });
    await expect(readWebhookBody(request)).rejects.toBeInstanceOf(
      WebhookBodyTooLargeError,
    );
    expect(request.bodyUsed).toBe(false);
  });

  it("rejects an oversized stream without a content-length header", async () => {
    const request = new Request("https://site.test/api/billing/webhook", {
      method: "POST",
      body: new Uint8Array(MAX_WEBHOOK_BODY_BYTES + 1),
    });
    await expect(readWebhookBody(request)).rejects.toBeInstanceOf(
      WebhookBodyTooLargeError,
    );
  });

  it("preserves the signed bytes within the limit", async () => {
    const body = '{"id":"evt_test","value":"✓"}';
    const request = new Request("https://site.test/api/billing/webhook", {
      method: "POST",
      body,
    });
    await expect(readWebhookBody(request)).resolves.toEqual(Buffer.from(body));
  });
});
