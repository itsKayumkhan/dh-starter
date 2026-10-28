"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSiteSettings } from "@/lib/content/settings";
import { UnauthorizedError, ValidationError } from "@/lib/errors";
import { safeAction } from "@/lib/safe-action";
import { BILLING_ROUTES } from "@/modules/billing/routes";
import {
  findPlan,
  findProduct,
  isConfiguredPrice,
  planIdSchema,
  productIdSchema,
} from "@/modules/billing/plans";
import { getOrCreateCustomer } from "@/modules/billing/server/customers";
import { getStripe } from "@/modules/billing/server/stripe";
import { createSubscriptionCheckout } from "@/modules/billing/server/subscription-checkout";

function checkoutUrl(url: string | null): string {
  if (!url) throw new ValidationError();
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== "checkout.stripe.com")
    throw new ValidationError();
  return url;
}

function subscriptionUrl(url: string): string {
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    !["checkout.stripe.com", "billing.stripe.com"].includes(parsed.hostname)
  )
    throw new ValidationError();
  return url;
}

async function createPortalUrl(customer: string) {
  const site = await getSiteSettings();
  const session = await getStripe().billingPortal.sessions.create({
    customer,
    return_url: new URL(BILLING_ROUTES.dashboard, site.url).toString(),
  });
  const parsed = new URL(session.url);
  if (parsed.protocol !== "https:" || parsed.hostname !== "billing.stripe.com")
    throw new ValidationError();
  return session.url;
}

const subscriptionCheckoutAction = safeAction(
  {
    schema: planIdSchema,
    auth: "user",
    rateLimit: {
      key: "billing:subscription-checkout",
      limit: 5,
      windowSec: 60,
    },
  },
  async (planId, { user }) => {
    if (!user) throw new UnauthorizedError();
    const plan = findPlan(planId);
    if (!plan || !isConfiguredPrice(plan.stripePriceId))
      throw new ValidationError();
    const customer = await getOrCreateCustomer(user);
    const site = await getSiteSettings();
    const url = await createSubscriptionCheckout({
      userId: user.id,
      customerId: customer,
      priceId: plan.stripePriceId,
      planId: plan.id,
      successUrl: new URL(BILLING_ROUTES.success, site.url).toString(),
      cancelUrl: new URL(BILLING_ROUTES.cancel, site.url).toString(),
      portalUrl: () => createPortalUrl(customer),
    });
    revalidatePath(BILLING_ROUTES.dashboard);
    return { url: subscriptionUrl(url) };
  },
);

export async function startSubscriptionCheckout(planId: string) {
  return subscriptionCheckoutAction(planId);
}

const oneTimeCheckoutAction = safeAction(
  {
    schema: productIdSchema,
    auth: "user",
    rateLimit: { key: "billing:one-time-checkout", limit: 5, windowSec: 60 },
  },
  async (productId, { user }) => {
    if (!user) throw new UnauthorizedError();
    const product = findProduct(productId);
    if (!product || !isConfiguredPrice(product.stripePriceId))
      throw new ValidationError();
    const customer = await getOrCreateCustomer(user);
    const site = await getSiteSettings();
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer,
      client_reference_id: user.id,
      line_items: [{ price: product.stripePriceId, quantity: 1 }],
      metadata: { userId: user.id, productId: product.id },
      payment_intent_data: {
        metadata: { userId: user.id, productId: product.id },
      },
      success_url: new URL(BILLING_ROUTES.success, site.url).toString(),
      cancel_url: new URL(BILLING_ROUTES.cancel, site.url).toString(),
    });
    revalidatePath(BILLING_ROUTES.dashboard);
    return { url: checkoutUrl(session.url) };
  },
);

export async function startOneTimeCheckout(productId: string) {
  return oneTimeCheckoutAction(productId);
}

const customerPortalAction = safeAction(
  {
    schema: z.undefined(),
    auth: "user",
    rateLimit: { key: "billing:portal", limit: 5, windowSec: 60 },
  },
  async (_input, { user }) => {
    if (!user) throw new UnauthorizedError();
    const customer = await getOrCreateCustomer(user);
    revalidatePath(BILLING_ROUTES.dashboard);
    return { url: await createPortalUrl(customer) };
  },
);

export async function openCustomerPortal() {
  return customerPortalAction(undefined);
}
