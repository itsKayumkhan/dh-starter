import "server-only";
import { db } from "@/lib/db";
import { getStripe } from "@/modules/billing/server/stripe";

export type BillingUser = { id: string; email: string; name: string };

export async function getOrCreateCustomer(user: BillingUser) {
  const existing = await db.billingCustomer.findUnique({ where: { userId: user.id } });
  if (existing) return existing.stripeCustomerId;

  const customer = await getStripe().customers.create(
    { email: user.email, name: user.name, metadata: { userId: user.id } },
    { idempotencyKey: `billing-customer:${user.id}` },
  );
  const saved = await db.billingCustomer.upsert({
    where: { userId: user.id },
    create: { userId: user.id, stripeCustomerId: customer.id },
    update: {},
  });
  return saved.stripeCustomerId;
}
