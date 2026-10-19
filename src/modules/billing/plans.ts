import { z } from "zod";

export type BillingPlan = {
  id: string;
  name: string;
  description: string;
  features: readonly string[];
  stripePriceId: string;
  interval: "month" | "year";
  displayAmount: string;
};

export type OneTimeProduct = Omit<BillingPlan, "interval">;

export const billingPlans = [
  {
    id: "starter-monthly",
    name: "Starter",
    description: "The essentials for a growing project.",
    features: ["Core platform access", "Email support", "Monthly billing"],
    stripePriceId: "price_REPLACE_STARTER_MONTHLY",
    interval: "month",
    displayAmount: "$19 / month",
  },
  {
    id: "pro-monthly",
    name: "Pro",
    description: "More room for an active team.",
    features: ["Everything in Starter", "Priority support", "Monthly billing"],
    stripePriceId: "price_REPLACE_PRO_MONTHLY",
    interval: "month",
    displayAmount: "$49 / month",
  },
] as const satisfies readonly BillingPlan[];

export const oneTimeProducts = [
  {
    id: "setup-session",
    name: "Setup session",
    description: "A one-time onboarding session.",
    features: ["Personal setup call"],
    stripePriceId: "price_REPLACE_SETUP_SESSION",
    displayAmount: "$99 once",
  },
] as const satisfies readonly OneTimeProduct[];

export const planIdSchema = z.enum(billingPlans.map((plan) => plan.id) as [string, ...string[]]);
export const productIdSchema = z.enum(oneTimeProducts.map((product) => product.id) as [string, ...string[]]);

export function findPlan(id: string) {
  return billingPlans.find((plan) => plan.id === id);
}

export function findProduct(id: string) {
  return oneTimeProducts.find((product) => product.id === id);
}

export function planIdFromPrice(priceId: string) {
  return billingPlans.find((plan) => plan.stripePriceId === priceId)?.id ?? "unknown";
}

export function isConfiguredPrice(priceId: string) {
  return priceId.startsWith("price_") && !priceId.startsWith("price_REPLACE_");
}
