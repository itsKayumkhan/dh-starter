import { z } from "zod";

const billingEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1).startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).startsWith("whsec_"),
});

export function getBillingEnv() {
  return billingEnvSchema.parse(process.env);
}

const billingE2ESchema = billingEnvSchema.extend({
  BILLING_E2E_EMAIL: z.email(),
  BILLING_E2E_PASSWORD: z.string().min(8),
});

export function getBillingE2EConfig() {
  return billingE2ESchema.safeParse(process.env);
}
