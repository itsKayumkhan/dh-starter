## Project

**Domia** (`domia-build`) is a multi-tenant property booking and operator management app. It is one Next.js 16.2.2 App Router project with React 19, Supabase Postgres and direct Supabase queries (no ORM), Supabase Auth, Tailwind CSS 4, and React context/local state. Zustand is installed but I found no usage. [package.json](<D:/coding/1_Adigital heroes/custom/booking/package.json>)

## Reusable modules found

- **Auth:** Supabase signup, password login, email verification/OTP, reset, sessions, and TOTP MFA; no OAuth flow found. [auth pages](<D:/coding/1_Adigital heroes/custom/booking/app/(auth)>), [auth callback](<D:/coding/1_Adigital heroes/custom/booking/app/api/auth/callback/route.ts>).
- **Roles/RBAC/permissions:** `guest`, `operator`, `super_admin`; API guards, feature gates, and Postgres RLS/triggers. [api-context.ts](<D:/coding/1_Adigital heroes/custom/booking/lib/api-context.ts>), [auth hardening migration](<D:/coding/1_Adigital heroes/custom/booking/supabase/migrations/20260511_auth_hardening.sql>).
- **Route protection:** Next.js `proxy.ts` redirects by session, role, approval, suspension, and MFA; layouts and API wrappers add checks. [proxy.ts](<D:/coding/1_Adigital heroes/custom/booking/proxy.ts>).
- **Admin/user management:** Dashboards, users, roles, suspension, owners, impersonation, and audit logs. [admin/users](<D:/coding/1_Adigital heroes/custom/booking/app/admin/users>), [role route](<D:/coding/1_Adigital heroes/custom/booking/app/api/admin/users/[id]/role/route.ts>).
- **API pattern:** Next.js route handlers, including reusable operator/admin wrappers; no Express or server-action pattern found. [app/api](<D:/coding/1_Adigital heroes/custom/booking/app/api>), [api-context.ts](<D:/coding/1_Adigital heroes/custom/booking/lib/api-context.ts>).
- **Validation:** Shared Zod schemas, plus some route-local checks. [validations.ts](<D:/coding/1_Adigital heroes/custom/booking/lib/validations.ts>).
- **Errors/logging:** JSON error responses, console-based `logError`/`logWarn`, and persistent admin audit entries; no shared `ActionResult` or `error.tsx` found. [observability.ts](<D:/coding/1_Adigital heroes/custom/booking/lib/observability.ts>), [audit-log.ts](<D:/coding/1_Adigital heroes/custom/booking/lib/audit-log.ts>).
- **Environment/config:** No central env schema; an admin endpoint reports presence of selected keys. Route lists live in `proxy.ts`, with other settings spread across modules. [env-status route](<D:/coding/1_Adigital heroes/custom/booking/app/api/admin/env-status/route.ts>).
- **Email/notifications:** Nodemailer SMTP adapter, localized HTML/text messages, calendar attachments, SMS via Twilio, toast UI, and an admin signal feed. [mailer.ts](<D:/coding/1_Adigital heroes/custom/booking/lib/mailer.ts>), [email.ts](<D:/coding/1_Adigital heroes/custom/booking/lib/email.ts>), [notifications page](<D:/coding/1_Adigital heroes/custom/booking/app/admin/notifications/page.tsx>).
- **Uploads:** Browser-side unsigned Cloudinary image uploads with client validation. [cloudinary.ts](<D:/coding/1_Adigital heroes/custom/booking/lib/cloudinary.ts>).
- **Payments:** Stripe Payment/Setup Intents, Connect, refunds, signed webhooks, and scheduled charges. Package tiers gate features; no Stripe recurring subscription billing found. [checkout route](<D:/coding/1_Adigital heroes/custom/booking/app/api/stripe/checkout/route.ts>), [webhook route](<D:/coding/1_Adigital heroes/custom/booking/app/api/stripe/webhook/route.ts>).
- **Rate limiting:** Supabase `rate_limits` table with sliding-window count and insert. [rate-limit.ts](<D:/coding/1_Adigital heroes/custom/booking/lib/rate-limit.ts>).
- **PDF/certificates:** None found; email generates ICS calendar attachments. [email-ics.ts](<D:/coding/1_Adigital heroes/custom/booking/lib/email-ics.ts>).
- **Search/pagination/tables:** Reusable table component; admin pages largely filter and paginate fetched rows in the browser. [data-table.tsx](<D:/coding/1_Adigital heroes/custom/booking/components/ui/data-table.tsx>), [users-client.tsx](<D:/coding/1_Adigital heroes/custom/booking/app/admin/users/users-client.tsx>).
- **Dashboard/analytics:** Admin and operator dashboards; revenue analytics uses a database RPC. [analytics page](<D:/coding/1_Adigital heroes/custom/booking/app/admin/analytics/page.tsx>).
- **i18n/SEO:** English/Italian message dictionaries and locale helpers; metadata, dynamic sitemap, and robots routes. [lib/i18n](<D:/coding/1_Adigital heroes/custom/booking/lib/i18n>), [sitemap.ts](<D:/coding/1_Adigital heroes/custom/booking/app/sitemap.ts>), [robots.ts](<D:/coding/1_Adigital heroes/custom/booking/app/robots.ts>).
- **Testing/CI/CD:** Node test specs and verification scripts; no automated e2e suite found. Docker/Vercel config and one GitHub Actions cron workflow, but no build/test CI workflow. [package.json](<D:/coding/1_Adigital heroes/custom/booking/package.json>), [workflow](<D:/coding/1_Adigital heroes/custom/booking/.github/workflows/charge-scheduled.yml>).
- **DB jobs/realtime:** SQL migrations and seed files; several authenticated cron routes. No active realtime subscription usage found. [supabase/migrations](<D:/coding/1_Adigital heroes/custom/booking/supabase/migrations>), [app/api/cron](<D:/coding/1_Adigital heroes/custom/booking/app/api/cron>).

## Best pieces to extract

1. [API context wrappers](<D:/coding/1_Adigital heroes/custom/booking/lib/api-context.ts>): typed, centralized role, MFA, tenant, and feature checks.
2. [Cached profile resolver](<D:/coding/1_Adigital heroes/custom/booking/lib/data/profile.ts>): deduplicates reads and selects a slim tenant record.
3. [Shared validation](<D:/coding/1_Adigital heroes/custom/booking/lib/validations.ts>): reusable input sanitization and consistent new-password policy.
4. [SMTP adapter](<D:/coding/1_Adigital heroes/custom/booking/lib/mailer.ts>): separates delivery configuration from email content.
5. [Audit-log helper](<D:/coding/1_Adigital heroes/custom/booking/lib/audit-log.ts>): records actor, action, target, and change context.

## Anti-patterns to avoid

- [Rate limiting](<D:/coding/1_Adigital heroes/custom/booking/lib/rate-limit.ts>) counts then inserts non-atomically and fails open on database errors.
- [Cloudinary uploads](<D:/coding/1_Adigital heroes/custom/booking/lib/cloudinary.ts>) use a public unsigned preset; UI access is the stated upload gate.
- [Stripe webhook](<D:/coding/1_Adigital heroes/custom/booking/app/api/stripe/webhook/route.ts>) records event IDs before processing, so a failure afterward can suppress a retry.
- Auth checks and Stripe clients are duplicated across routes; environment variables lack a central validated contract. [admin-auth.ts](<D:/coding/1_Adigital heroes/custom/booking/lib/admin-auth.ts>), [stripe.ts](<D:/coding/1_Adigital heroes/custom/booking/lib/stripe.ts>).

## Project-specific (not reusable)

Property/room booking and pricing rules, OTA/Channex sync, concierge logic, tenant landing pages, and Domia-branded content. [booking-pricing.ts](<D:/coding/1_Adigital heroes/custom/booking/lib/booking-pricing.ts>), [lib/channex](<D:/coding/1_Adigital heroes/custom/booking/lib/channex>).