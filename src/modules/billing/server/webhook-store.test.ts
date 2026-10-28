import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const { create, updateMany, findUnique } = vi.hoisted(() => ({
  create: vi.fn(),
  updateMany: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { webhookEvent: { create, updateMany, findUnique } },
}));

import { webhookStore } from "@/modules/billing/server/webhook-store";

const event = { id: "evt-1", type: "payment_intent.succeeded" } as Stripe.Event;
const claimedAt = new Date("2026-01-01T00:00:00.000Z");

beforeEach(() => {
  vi.resetAllMocks();
  create.mockResolvedValue({ id: event.id });
  updateMany.mockResolvedValue({ count: 1 });
});

describe("webhookStore", () => {
  it("claims a new event with processing status and one attempt", async () => {
    const result = await webhookStore.claim(event);
    expect(result).toEqual({ state: "claimed", claimedAt: expect.any(Date) });
    expect(create).toHaveBeenCalledExactlyOnceWith({
      data: {
        id: event.id,
        type: event.type,
        status: "processing",
        attempts: 1,
        receivedAt: result.state === "claimed" ? result.claimedAt : undefined,
      },
    });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("reclaims a failed or stale event after a duplicate insert", async () => {
    create.mockRejectedValue({ code: "P2002" });
    const result = await webhookStore.claim(event);
    expect(result.state).toBe("claimed");
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: event.id,
        type: event.type,
        OR: [
          { status: "failed" },
          { status: "processing", receivedAt: { lte: expect.any(Date) } },
        ],
      },
      data: {
        status: "processing",
        attempts: { increment: 1 },
        lastError: null,
        receivedAt: expect.any(Date),
        processedAt: null,
      },
    });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it.each([
    ["processed", "processed"],
    ["processing", "processing"],
  ] as const)(
    "reports an existing %s event without reclaiming it",
    async (status, state) => {
      create.mockRejectedValue({ code: "P2002" });
      updateMany.mockResolvedValue({ count: 0 });
      findUnique.mockResolvedValue({ status, type: event.type });
      await expect(webhookStore.claim(event)).resolves.toEqual({ state });
      expect(findUnique).toHaveBeenCalledWith({
        where: { id: event.id },
        select: { status: true, type: true },
      });
    },
  );

  it.each([
    null,
    { status: "processed", type: "other.event" },
    { status: "failed", type: event.type },
  ])(
    "fails closed on an inconsistent duplicate claim: %j",
    async (existing) => {
      create.mockRejectedValue({ code: "P2002" });
      updateMany.mockResolvedValue({ count: 0 });
      findUnique.mockResolvedValue(existing);
      await expect(webhookStore.claim(event)).rejects.toThrow();
    },
  );

  it("does not read or update after an unrelated create failure", async () => {
    create.mockRejectedValue(new Error("database unavailable"));
    await expect(webhookStore.claim(event)).rejects.toThrow(
      "database unavailable",
    );
    expect(updateMany).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("marks only the matching active claim processed", async () => {
    await expect(
      webhookStore.markProcessed(event.id, claimedAt),
    ).resolves.toBeUndefined();
    expect(updateMany).toHaveBeenCalledExactlyOnceWith({
      where: { id: event.id, status: "processing", receivedAt: claimedAt },
      data: {
        status: "processed",
        processedAt: expect.any(Date),
        lastError: null,
      },
    });
  });

  it("rejects completion of an expired or already finished claim", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    await expect(
      webhookStore.markProcessed(event.id, claimedAt),
    ).rejects.toThrow("Webhook claim expired before completion");
  });

  it("records a failed claim only when its timestamp still matches", async () => {
    await webhookStore.markFailed(event.id, claimedAt, "temporary error");
    expect(updateMany).toHaveBeenCalledExactlyOnceWith({
      where: { id: event.id, status: "processing", receivedAt: claimedAt },
      data: { status: "failed", lastError: "temporary error" },
    });
  });

  it("propagates a failed status write", async () => {
    updateMany.mockRejectedValue(new Error("database unavailable"));
    await expect(
      webhookStore.markFailed(event.id, claimedAt, "error"),
    ).rejects.toThrow("database unavailable");
  });
});
