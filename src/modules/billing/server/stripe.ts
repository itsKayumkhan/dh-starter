import "server-only";
import Stripe from "stripe";
import { getBillingEnv } from "@/modules/billing/env";

let client: Stripe | undefined;

export function getStripe() {
  client ??= new Stripe(getBillingEnv().STRIPE_SECRET_KEY);
  return client;
}
