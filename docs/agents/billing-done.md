# Billing delivery

## Files

- `prisma/schema/billing.prisma`: customer, subscription, payment and webhook claim records.
- `src/modules/billing/`: manifest, navigation, routes, plans, env validation, Checkout and portal actions, webhook processing, data access, UI components and unit tests.
- `src/app/api/billing/webhook/route.ts`: signed Stripe webhook receiver.
- `src/app/(marketing)/pricing/`: public pricing page.
- `src/app/(dashboard)/dashboard/billing/`: customer billing, success and cancel pages, loading and error states.
- `src/app/(dashboard)/admin/billing/`: paginated payment and subscription tables, loading and error states.
- `tests/e2e/billing.spec.ts`: login to Stripe Checkout browser flow.
- `docs/agents/billing-checklist.md` and `docs/agents/billing-needs.md`: production replacements and shared integration notes.

## Use

Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`; replace example Price IDs and amounts in `plans.ts`; configure the customer portal and the event list in `src/modules/billing/README.md`; apply a Prisma migration; register `billingModule` in the shared module registry. Checkout actions require a signed-in user, are rate limited, and return a Stripe URL. Existing active subscribers open the portal to change plans. Admin tables require `billing:manage`.

`module.json` declares billing's owned paths, Prisma file, Stripe packages and three env keys. It has no module dependencies. Optional Playwright fixture keys are `BILLING_E2E_EMAIL` and `BILLING_E2E_PASSWORD`.

## Verification

`npx prisma validate` and `npx prisma generate` passed. The final `npx tsc --noEmit -p .` and scoped ESLint passed. Seven billing Vitest tests passed. `npx playwright test tests/e2e/billing.spec.ts --list` found the browser test. The browser test was not run because this wave prohibits starting `next dev` and needs real Stripe test keys, prices and a seeded login.

## TODO

- Lead: register `billingModule` in `src/config/modules.ts` and merge the checklist items into `docs/PRODUCTION_CHECKLIST.md`.
- Project owner: replace example offers and Price IDs, configure Stripe webhook and customer portal, migrate the schema and run a signed-in Stripe test checkout.
- Core owner: widen `requireUser`'s optional return path type if deep-link return after sign-in is needed; see `billing-needs.md`.
