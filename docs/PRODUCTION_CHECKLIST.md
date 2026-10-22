# Production checklist

## Core

- [ ] **prisma/seed.mts:19** - Do not run development seed logins in production + predictable credentials would grant access.
- [ ] **.env.example:14** - Replace console email provider with Resend or SMTP + console delivery is disabled in production.
- [ ] **.env.example:4** - Set a new unique BETTER_AUTH_SECRET in production + shared development secrets can compromise sessions.
- [ ] **src/config/site.ts:6** - Replace placeholder description, logo, email, address and social links + outgoing pages and emails must carry the client brand.
- [ ] **.env.example:2** - Replace example local database credentials for each deployment + example values must never point at a production database.
- [ ] **.github/workflows/ci.yml:8** - Keep CI dummy credentials isolated from deployment secrets + build checks do not need live services.
- [ ] **prisma.config.ts:13** - Supply a real DATABASE_URL before migrating + the fallback URL is intentionally invalid.
- [ ] **src/lib/env/client.ts:8** - Set NEXT_PUBLIC_APP_URL to the public production origin + the development fallback points to localhost.

## Dashboard shell (core)

- [ ] **src/app/(dashboard)/dashboard/page.tsx:16** - Replace the four demo StatCard values with authorized project metrics + placeholder figures would mislead production users.
- [ ] **src/components/layout/demo-activity-chart.tsx:7** - Replace the demo activity series with authorized project metrics + sample trend is not live activity.
- [ ] **tests/e2e/shell.spec.ts:14** - Replace fixed seed admin credentials in production-facing test pipelines + the demo account must not exist in production.

## Module: admin

- [ ] **tests/e2e/admin.spec.ts:9** - Replace or remove the documented development seed login before production test runs + the seeded credentials are only for local browser testing.

## Module: uploads

- [ ] **src/modules/uploads/env.ts:5** - Set the production Cloudinary cloud name, API key, API secret, and unique folder prefix + signed uploads and Admin API verification cannot run without production credentials.
- [ ] **src/modules/uploads/upload-rules.ts:3** - Review allowed formats, folder sizes, and the Cloudinary account's upload restrictions + production media policy may require different limits.

## Module: billing

- [ ] **src/modules/billing/plans.ts:21** - Replace the Starter placeholder Stripe Price ID + checkout cannot start with a placeholder.
- [ ] **src/modules/billing/plans.ts:30** - Replace the Pro placeholder Stripe Price ID + checkout cannot start with a placeholder.
- [ ] **src/modules/billing/plans.ts:42** - Replace the one-time setup placeholder Stripe Price ID + checkout cannot start with a placeholder.
- [ ] **src/modules/billing/plans.ts:23** - Match the Starter display amount to its live Stripe Price + customers must see the amount charged by Stripe.
- [ ] **src/modules/billing/plans.ts:32** - Match the Pro display amount to its live Stripe Price + customers must see the amount charged by Stripe.
- [ ] **src/modules/billing/plans.ts:43** - Match the one-time setup display amount to its live Stripe Price + customers must see the amount charged by Stripe.
- [ ] **src/modules/billing/plans.ts:18** - Replace example Starter name, description and features with the actual offer + marketing copy must describe the delivered service.
- [ ] **src/modules/billing/plans.ts:27** - Replace example Pro name, description and features with the actual offer + marketing copy must describe the delivered service.
- [ ] **src/modules/billing/plans.ts:39** - Replace or remove the example setup session product + do not offer an unavailable service.

## Module: notifications

- [ ] **tests/e2e/notifications.spec.ts:15** - Remove or rotate seeded test account credentials before any production test run + the starter credentials are public development fixtures.

## Module: contact

- [ ] **src/modules/contact/env.ts:13** - Set CONTACT_NOTIFY_EMAIL to a real monitored inbox + the fallback site support address is a starter placeholder.
- [ ] **src/config/site.ts:14** - Replace the starter support email address + contact details and fallback notification delivery need a real address.
- [ ] **src/config/site.ts:15** - Replace the starter business address + it is displayed on the contact page and email footer.
