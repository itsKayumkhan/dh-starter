import { beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimitError, UnauthorizedError } from "@/lib/errors";
import { MESSAGES } from "@/lib/constants/messages";

const {
  assertUser,
  assertRateLimit,
  getOrCreateCustomer,
  getSiteSettings,
  createSubscriptionCheckout,
  checkoutCreate,
  portalCreate,
  revalidatePath,
  loggerError,
} = vi.hoisted(() => ({
  assertUser: vi.fn(),
  assertRateLimit: vi.fn(),
  getOrCreateCustomer: vi.fn(),
  getSiteSettings: vi.fn(),
  createSubscriptionCheckout: vi.fn(),
  checkoutCreate: vi.fn(),
  portalCreate: vi.fn(),
  revalidatePath: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/auth/session", () => ({
  assertUser,
  assertPermission: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit }));
vi.mock("@/lib/request", () => ({
  getClientIp: vi.fn(async () => "127.0.0.1"),
}));
vi.mock("@/lib/logger", () => ({ logger: { error: loggerError } }));
vi.mock("@/lib/content/settings", () => ({ getSiteSettings }));
vi.mock("@/modules/billing/server/customers", () => ({ getOrCreateCustomer }));
vi.mock("@/modules/billing/server/subscription-checkout", () => ({
  createSubscriptionCheckout,
}));
vi.mock("@/modules/billing/server/stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: checkoutCreate } },
    billingPortal: { sessions: { create: portalCreate } },
  }),
}));
vi.mock("@/modules/billing/plans", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/modules/billing/plans")>();
  return {
    ...original,
    findPlan: (id: string) => {
      const plan = original.findPlan(id);
      return plan ? { ...plan, stripePriceId: "price_live_plan" } : undefined;
    },
    findProduct: (id: string) => {
      const product = original.findProduct(id);
      return product
        ? { ...product, stripePriceId: "price_live_product" }
        : undefined;
    },
  };
});

import {
  openCustomerPortal,
  startOneTimeCheckout,
  startSubscriptionCheckout,
} from "@/modules/billing/server/actions";
import { BILLING_ROUTES } from "@/modules/billing/routes";

const user = { id: "user-1", email: "one@example.test", name: "One" };

beforeEach(() => {
  vi.resetAllMocks();
  assertUser.mockResolvedValue(user);
  assertRateLimit.mockResolvedValue(undefined);
  getOrCreateCustomer.mockResolvedValue("cus-1");
  getSiteSettings.mockResolvedValue({ url: "https://site.test" });
  createSubscriptionCheckout.mockResolvedValue(
    "https://checkout.stripe.com/session",
  );
  checkoutCreate.mockResolvedValue({
    url: "https://checkout.stripe.com/payment",
  });
  portalCreate.mockResolvedValue({ url: "https://billing.stripe.com/portal" });
});

describe("billing actions", () => {
  it("starts subscription checkout with the caller's customer and route URLs", async () => {
    await expect(startSubscriptionCheckout("starter-monthly")).resolves.toEqual(
      {
        ok: true,
        data: { url: "https://checkout.stripe.com/session" },
      },
    );
    expect(getOrCreateCustomer).toHaveBeenCalledExactlyOnceWith(user);
    expect(createSubscriptionCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        customerId: "cus-1",
        priceId: "price_live_plan",
        planId: "starter-monthly",
        successUrl: `https://site.test${BILLING_ROUTES.success}`,
        cancelUrl: `https://site.test${BILLING_ROUTES.cancel}`,
        portalUrl: expect.any(Function),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledExactlyOnceWith(
      BILLING_ROUTES.dashboard,
    );
    expect(assertRateLimit).toHaveBeenCalledWith(
      "billing:subscription-checkout:user-1",
      5,
      60,
    );
  });

  it("starts a one-time payment with user and product metadata", async () => {
    await expect(startOneTimeCheckout("setup-session")).resolves.toEqual({
      ok: true,
      data: { url: "https://checkout.stripe.com/payment" },
    });
    expect(checkoutCreate).toHaveBeenCalledExactlyOnceWith({
      mode: "payment",
      customer: "cus-1",
      client_reference_id: user.id,
      line_items: [{ price: "price_live_product", quantity: 1 }],
      metadata: { userId: user.id, productId: "setup-session" },
      payment_intent_data: {
        metadata: { userId: user.id, productId: "setup-session" },
      },
      success_url: `https://site.test${BILLING_ROUTES.success}`,
      cancel_url: `https://site.test${BILLING_ROUTES.cancel}`,
    });
    expect(revalidatePath).toHaveBeenCalledExactlyOnceWith(
      BILLING_ROUTES.dashboard,
    );
    expect(assertRateLimit).toHaveBeenCalledWith(
      "billing:one-time-checkout:user-1",
      5,
      60,
    );
  });

  it("opens the customer portal with a dashboard return URL", async () => {
    await expect(openCustomerPortal()).resolves.toEqual({
      ok: true,
      data: { url: "https://billing.stripe.com/portal" },
    });
    expect(portalCreate).toHaveBeenCalledExactlyOnceWith({
      customer: "cus-1",
      return_url: `https://site.test${BILLING_ROUTES.dashboard}`,
    });
    expect(revalidatePath).toHaveBeenCalledExactlyOnceWith(
      BILLING_ROUTES.dashboard,
    );
    expect(assertRateLimit).toHaveBeenCalledWith(
      "billing:portal:user-1",
      5,
      60,
    );
  });

  it.each([
    [startSubscriptionCheckout, undefined],
    [startSubscriptionCheckout, "not-a-plan"],
    [startSubscriptionCheckout, "x".repeat(300)],
    [startSubscriptionCheckout, 123],
    [startOneTimeCheckout, undefined],
    [startOneTimeCheckout, "not-a-product"],
    [startOneTimeCheckout, "x".repeat(300)],
    [startOneTimeCheckout, 123],
  ])(
    "rejects invalid checkout input without side effects",
    async (action, input) => {
      const result = await action(input as string);
      expect(result).toMatchObject({ ok: false, error: MESSAGES.validation });
      if (!result.ok) expect(result.fieldErrors?._form).toBeDefined();
      expect(assertUser).not.toHaveBeenCalled();
      expect(getOrCreateCustomer).not.toHaveBeenCalled();
      expect(checkoutCreate).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["subscription", () => startSubscriptionCheckout("starter-monthly")],
    ["one-time", () => startOneTimeCheckout("setup-session")],
    ["portal", () => openCustomerPortal()],
  ])(
    "denies anonymous %s requests before creating a customer",
    async (_name, action) => {
      assertUser.mockRejectedValue(new UnauthorizedError());
      await expect(action()).resolves.toEqual({
        ok: false,
        error: MESSAGES.unauthorized,
      });
      expect(getOrCreateCustomer).not.toHaveBeenCalled();
      expect(checkoutCreate).not.toHaveBeenCalled();
      expect(portalCreate).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["subscription", () => startSubscriptionCheckout("starter-monthly")],
    ["one-time", () => startOneTimeCheckout("setup-session")],
    ["portal", () => openCustomerPortal()],
  ])(
    "denies rate-limited %s requests before creating a customer",
    async (_name, action) => {
      assertRateLimit.mockRejectedValue(new RateLimitError());
      await expect(action()).resolves.toEqual({
        ok: false,
        error: MESSAGES.rateLimited,
      });
      expect(getOrCreateCustomer).not.toHaveBeenCalled();
      expect(checkoutCreate).not.toHaveBeenCalled();
      expect(portalCreate).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    },
  );

  it.each([
    [
      "subscription",
      () => startSubscriptionCheckout("starter-monthly"),
      createSubscriptionCheckout,
    ],
    ["one-time", () => startOneTimeCheckout("setup-session"), checkoutCreate],
  ])("hides a %s provider failure", async (_name, action, provider) => {
    provider.mockRejectedValue(new Error("private provider detail"));
    const result = await action();
    expect(result).toEqual({ ok: false, error: MESSAGES.internal });
    expect(JSON.stringify(result)).not.toContain("private provider detail");
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(loggerError).toHaveBeenCalledOnce();
  });

  it.todo("does not revalidate the billing page when portal creation fails");
});
