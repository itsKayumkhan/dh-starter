import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, upsert, createCustomer } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  upsert: vi.fn(),
  createCustomer: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { billingCustomer: { findUnique, upsert } },
}));
vi.mock("@/modules/billing/server/stripe", () => ({
  getStripe: () => ({ customers: { create: createCustomer } }),
}));

import { getOrCreateCustomer } from "@/modules/billing/server/customers";

const user = { id: "user-1", email: "one@example.test", name: "One" };

describe("getOrCreateCustomer", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    findUnique.mockResolvedValue(null);
    createCustomer.mockResolvedValue({ id: "cus-new" });
    upsert.mockResolvedValue({ stripeCustomerId: "cus-new" });
  });

  it("returns the saved customer without creating another", async () => {
    findUnique.mockResolvedValue({ stripeCustomerId: "cus-existing" });
    await expect(getOrCreateCustomer(user)).resolves.toBe("cus-existing");
    expect(findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { userId: user.id },
    });
    expect(createCustomer).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("creates a Stripe customer with a per-user idempotency key and saves it", async () => {
    await expect(getOrCreateCustomer(user)).resolves.toBe("cus-new");
    expect(createCustomer).toHaveBeenCalledExactlyOnceWith(
      { email: user.email, name: user.name, metadata: { userId: user.id } },
      { idempotencyKey: "billing-customer:user-1" },
    );
    expect(upsert).toHaveBeenCalledExactlyOnceWith({
      where: { userId: user.id },
      create: { userId: user.id, stripeCustomerId: "cus-new" },
      update: {},
    });
  });

  it("uses the stored winner when concurrent creation saved another customer", async () => {
    upsert.mockResolvedValue({ stripeCustomerId: "cus-winner" });
    await expect(getOrCreateCustomer(user)).resolves.toBe("cus-winner");
  });

  it("does not write when the lookup or Stripe creation fails", async () => {
    findUnique.mockRejectedValueOnce(new Error("lookup failed"));
    await expect(getOrCreateCustomer(user)).rejects.toThrow("lookup failed");
    expect(createCustomer).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();

    createCustomer.mockRejectedValueOnce(new Error("provider failed"));
    await expect(getOrCreateCustomer(user)).rejects.toThrow("provider failed");
    expect(upsert).not.toHaveBeenCalled();
  });

  it("surfaces a failed save to the caller", async () => {
    upsert.mockRejectedValue(new Error("save failed"));
    await expect(getOrCreateCustomer(user)).rejects.toThrow("save failed");
  });
});
