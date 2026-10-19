# Stripe billing module

This module provides hosted Stripe Checkout, subscriptions, one-time payments, the Stripe customer portal, payment history, admin lists and an idempotent webhook endpoint.

## Setup

1. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in the server environment. The publishable key is reserved for future client-side Stripe features; hosted Checkout does not read it in the browser.
2. Replace the three `price_REPLACE_*` IDs in `plans.ts` with Stripe Price IDs. Match the display amounts and intervals to the real Stripe Prices.
3. Configure the Stripe customer portal and register the webhook URL at `/api/billing/webhook`. Subscribe to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `payment_intent.succeeded`, `payment_intent.payment_failed` and `charge.refunded`.
4. Generate a Prisma migration from `prisma/schema/billing.prisma`, apply it, and run Prisma Client generation before using billing in a deployed environment.
5. Register `billingModule` in `src/config/modules.ts` with `// module:billing` markers on the import and array entry. The lead agent owns that shared file.

`/pricing` is public. Signed-in customers can open Checkout or the portal and review their plan at `/dashboard/billing`. Admins with `billing:manage` can review payments at `/admin/billing` and subscriptions at `/admin/billing/subscriptions`.

The webhook verifies the raw Stripe signature before touching the database. It claims each event ID in `WebhookEvent`, acknowledges processed or recently processing duplicates, retries failed and stale claims, and records a failed attempt if handling fails. Stripe remains the payment source of truth; this module stores a local display and admin history.

## Tests

Run `npx vitest run src/modules/billing` for unit tests. The Playwright checkout test needs the three Stripe keys above, configured test Price IDs and a seeded login supplied as `BILLING_E2E_EMAIL` and `BILLING_E2E_PASSWORD`. It skips when these are absent.

## Removal

Preview with `npm run module:remove -- billing --dry-run`, then remove the module through the module script and create a follow-up Prisma migration to drop its tables.
