## Project

**patrick-samsung-store** is a Samsung and Motorola ecommerce storefront with customer accounts and an operations dashboard. Single Next.js 16.3.4 App Router project; PostgreSQL with Prisma 6.19.3; custom password and signed-cookie auth; Tailwind CSS 4 and Radix UI; Zustand for client state. No monorepo. ([package.json](<D:/coding/1_Adigital heroes/custom/patrick/package.json>), [schema.prisma](<D:/coding/1_Adigital heroes/custom/patrick/prisma/schema.prisma>))

## Reusable modules found

- **Auth:** Customer signup/login, admin login, password reset, and revocable signed sessions exist. Email verification and OAuth flows do not; `emailVerified` is only stored/read. ([customer.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/auth/customer.ts>), [admin.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/auth/admin.ts>))
- **Roles/RBAC/permissions:** `CUSTOMER`, `SUPPORT`, `MANAGER`, `OWNER` exist, but admin access is one shared OWNER/MANAGER gate, without granular permissions. **Route protection:** `proxy.ts` redirects; server-side guards enforce access again. ([config.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/auth/config.ts>), [proxy.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/proxy.ts>), [guard.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/auth/guard.ts>))
- **Admin panel/user management:** Product, inventory, order, return, review, content, and settings screens exist; no user-management screen. Admin grants use a script. ([dashboard.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/features/admin/queries/dashboard.ts>), [grant-admin.mjs](<D:/coding/1_Adigital heroes/custom/patrick/scripts/grant-admin.mjs>))
- **API/validation/errors:** Mutations primarily use Server Actions; webhooks, search, cron, and feeds use route handlers. Zod schemas live in `src/lib/validations` and feature folders. `ActionResult`, guarded actions, error classes, and `error.tsx` boundaries standardize failures. ([types/index.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/types/index.ts>), [validations](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/validations>), [error.tsx](<D:/coding/1_Adigital heroes/custom/patrick/src/app/error.tsx>))
- **Env/constants:** Zod validates public and server variables; routes and cache tags are centralized. ([env.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/env.ts>), [routes.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/constants/routes.ts>))
- **Email/notifications:** Resend sends string-rendered transactional templates; Twilio sends opted-in SMS; UI toasts also exist. ([email/client.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/email/client.ts>), [sms/client.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/sms/client.ts>), [toast.tsx](<D:/coding/1_Adigital heroes/custom/patrick/src/components/ui/toast.tsx>))
- **Uploads/storage:** Admin action signs direct Cloudinary uploads, with shared MIME and size rules. ([media.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/features/admin/actions/media.ts>), [cloudinary-upload.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/images/cloudinary-upload.ts>))
- **Payments:** Stripe PaymentIntents/Payment Element, Tax, refunds, and signed webhooks exist; subscriptions do not. ([payment-step.tsx](<D:/coding/1_Adigital heroes/custom/patrick/src/features/checkout/components/payment-step.tsx>), [webhook route](<D:/coding/1_Adigital heroes/custom/patrick/src/app/api/webhooks/stripe/route.ts>))
- **Rate limiting/logging:** A pluggable limiter defaults to process-local memory; logging uses `console`, with no centralized logger. ([rate-limit.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/auth/rate-limit.ts>))
- **Search/pagination/tables:** PostgreSQL full-text and trigram search sit behind an adapter; Zod parses list filters, with reusable admin table components. ([search](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/search>), [filters.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/features/admin/schemas/filters.ts>))
- **Dashboard/analytics:** SQL-backed admin metrics plus typed GA4/GTM ecommerce events. ([dashboard.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/features/admin/queries/dashboard.ts>), [events.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/components/analytics/events.ts>))
- **i18n/SEO:** English/Spanish typed dictionaries and cookie-based locale selection; page metadata, sitemap, and robots rules exist. ([dictionary.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/i18n/dictionary.ts>), [sitemap.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/app/sitemap.ts>), [robots.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/app/robots.ts>))
- **Testing/CI/CD/DB/jobs:** Ad hoc Playwright QA scripts and documents exist, but no committed unit/e2e suite or build/test workflow. Prisma migrations and seed scripts exist. GitHub Actions and Vercel schedule guarded cron sweepers. ([migrations](<D:/coding/1_Adigital heroes/custom/patrick/prisma/migrations>), [seed.ts](<D:/coding/1_Adigital heroes/custom/patrick/prisma/seed.mts>), [workflows](<D:/coding/1_Adigital heroes/custom/patrick/.github/workflows>))
- **PDF/certificates; realtime:** No implementation found.

## Best pieces to extract

1. [Session standing and revocation](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/auth/revocation.ts>): checks account state and supports per-session sign-out.
2. [ActionResult and guarded actions](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/auth/guard.ts>): consistent authorization and browser-safe mutation results.
3. [Environment validation](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/env.ts>): separates public validation from lazy server validation.
4. [Signed upload flow](<D:/coding/1_Adigital heroes/custom/patrick/src/features/admin/actions/media.ts>): authorizes uploads before issuing Cloudinary signatures.
5. [Typed dictionaries](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/i18n/dictionary.ts>): reusable translation shape with source-language fallback.

## Anti-patterns to avoid

- Checkout continues with zero tax after a failed Stripe Tax quote; block this before live payment use. ([start-checkout.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/features/checkout/actions/start-checkout.ts>))
- Process-local rate limits do not coordinate across instances. ([rate-limit.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/auth/rate-limit.ts>))
- Webhook effects can run without a durable claim when its store fails. ([idempotency.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/stripe/idempotency.ts>))
- Admin role lists and session token encoding are duplicated; consolidate these before extraction. ([admin.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/auth/admin.ts>), [customer-session.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/auth/customer-session.ts>))

## Project-specific (not reusable)

Samsung/Motorola catalog and seed data, distributor branding, product specifications, regional shipping rules, and Google Merchant feed. ([seed-data](<D:/coding/1_Adigital heroes/custom/patrick/prisma/seed-data>), [routes.ts](<D:/coding/1_Adigital heroes/custom/patrick/src/lib/constants/routes.ts>), [feed route](<D:/coding/1_Adigital heroes/custom/patrick/src/app/api/feeds/google-merchant.xml/route.ts>))

