## Project

**AirTrainr** is a sports training marketplace connecting athletes and trainers. It is a pnpm monorepo with Next.js 16.1.6/React 19, an Expo app, Supabase Postgres with no ORM, Supabase Auth, Tailwind CSS 4, and React Context/local state ([web package](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/package.json>), [workspace](<D:/coding/1_Adigital heroes/custom/airtrainer/pnpm-workspace.yaml>)).

## Reusable modules found

- **Auth, yes:** Supabase signup, password login, confirmation email, reset, Google OAuth, and client-managed sessions ([auth.ts](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/lib/auth.ts>), [auth pages](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/auth>), [confirmation template](<D:/coding/1_Adigital heroes/custom/airtrainer/docs/supabase-email-templates/confirm-signup.html>)).
- **Roles/RBAC, partial:** Athlete, trainer, and admin roles; database RLS and server role checks ([shared types](<D:/coding/1_Adigital heroes/custom/airtrainer/packages/shared/src/types.ts>), [admin-auth.ts](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/lib/admin-auth.ts>)).
- **Route protection, yes:** Middleware redirects and checks admin role; dashboard layouts also check client state ([middleware.ts](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/middleware.ts>), [dashboard layout](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/dashboard/layout.tsx>)).
- **Admin/user management, yes:** User lists, approvals, deletion, payments, and audit views ([admin pages](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/admin>), [delete route](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/api/admin/delete-user/route.ts>)).
- **API pattern, yes:** Next.js Route Handlers plus direct client Supabase calls; no server actions or Express ([api routes](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/api>)).
- **Validation, partial:** Hand-written checks and shared utilities; no Zod schema layer ([utils.ts](<D:/coding/1_Adigital heroes/custom/airtrainer/packages/shared/src/utils.ts>)).
- **Error handling, partial:** Per-route `try/catch` and JSON errors; no shared error classes, `ActionResult`, or `error.tsx` ([contact route](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/api/contact/route.ts>)).
- **Env validation, partial:** Individual presence checks; no central schema ([checkout route](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/api/stripe/create-checkout/route.ts>)).
- **Constants/routes config, partial:** Domain constants in shared types; navigation paths live in layouts ([types.ts](<D:/coding/1_Adigital heroes/custom/airtrainer/packages/shared/src/types.ts>), [dashboard layout](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/dashboard/layout.tsx>)).
- **Email, yes:** Nodemailer SMTP, shared HTML layout, transactional messages, and Supabase auth templates ([email.ts](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/lib/email.ts>), [templates](<D:/coding/1_Adigital heroes/custom/airtrainer/docs/supabase-email-templates>)).
- **Uploads/storage, yes:** Browser uploads to Cloudinary; admin route signs protected delivery URLs ([cloudinary.ts](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/lib/cloudinary.ts>), [signed URL route](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/api/admin/cloudinary-signed-url/route.ts>)).
- **Payments, yes:** Stripe Checkout, payment intents, Connect payouts, subscriptions, and signed webhooks ([Stripe routes](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/api/stripe>)).
- **Rate limiting, no:** No enforcement found; only unused attempt-limit constants ([types.ts](<D:/coding/1_Adigital heroes/custom/airtrainer/packages/shared/src/types.ts>)).
- **Logging, partial:** Console logging and admin audit records; no structured logger ([admin-auth.ts](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/lib/admin-auth.ts>)).
- **Notifications, yes:** Supabase rows, realtime updates, and email ([NotificationContext.tsx](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/context/NotificationContext.tsx>)).
- **PDF/certificates, partial:** PDF verification-document upload and review; no generation ([trainer setup](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/dashboard/trainer/setup/page.tsx>)).
- **Search/pagination/tables, yes:** Client-side filtering, sorting, and array slicing ([trainer search](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/dashboard/search/page.tsx>), [admin athletes](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/admin/athletes/page.tsx>)).
- **Dashboard/analytics, yes:** Admin stats API and role dashboards ([stats route](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/api/admin/dashboard-stats/route.ts>)).
- **i18n, no:** English-only root layout; no locale framework ([layout.tsx](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/layout.tsx>)).
- **SEO, partial:** Static metadata and Open Graph; no sitemap or robots route ([layout.tsx](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/layout.tsx>)).
- **Testing, partial:** Playwright browser flows; no meaningful unit suite ([e2e](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/e2e>), [Playwright config](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/playwright.config.ts>)).
- **CI/CD, partial:** Vercel deployment config; no CI workflow found ([vercel.json](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/vercel.json>)).
- **Migrations/seed, yes:** Supabase SQL migrations and a test-data seed script ([migrations](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/supabase/migrations>), [seed script](<D:/coding/1_Adigital heroes/custom/airtrainer/scripts/seed-test-data.js>)).
- **Cron/jobs, yes:** Vercel scheduled profile reminder; separate offer-expiry endpoint ([vercel.json](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/vercel.json>), [cron route](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/api/cron/profile-notify/route.ts>)).
- **Realtime, yes:** Supabase subscriptions for notifications, messages, bookings, and offers ([MessagesContext.tsx](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/context/MessagesContext.tsx>), [migration](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/supabase/migrations/20260422090000_enable_messages_realtime.sql>)).

## Best pieces to extract

1. [email.ts](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/lib/email.ts>): reusable email layout, escaping, and CTA helpers.
2. [Stripe webhook route](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/api/stripe/webhook/route.ts>): raw-body signature verification and lifecycle coverage; extract the ingress pattern.
3. [Admin audit migration](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/supabase/migrations/20260427001000_admin_audit_log_and_rls.sql>): useful audit table and indexes.
4. [NotificationContext.tsx](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/context/NotificationContext.tsx>): realtime subscription and cleanup pattern.
5. [Toast.tsx](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/components/ui/Toast.tsx>): small, app-wide toast API.

## Anti-patterns to avoid

The auth boundary needs redesign before reuse: browser-written identity cookies and request-supplied user ID headers can impersonate accounts ([auth.ts](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/lib/auth.ts>), [admin-auth.ts](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/lib/admin-auth.ts>)). Message RLS grants access with `USING (true)` ([migration](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/supabase/migrations/20260422090000_enable_messages_realtime.sql>)). The offer-expiry service-role endpoint has no caller authentication ([route](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/api/offers/expire/route.ts>)). Build errors are ignored, and E2E credentials are hardcoded ([next.config.ts](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/next.config.ts>), [e2e config](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/e2e/config.ts>)).

## Project-specific (not reusable)

Sports taxonomy, trainer matching and availability, booking rules, founding-member pricing, and athlete/trainer profile flows ([shared types](<D:/coding/1_Adigital heroes/custom/airtrainer/packages/shared/src/types.ts>), [trainer search](<D:/coding/1_Adigital heroes/custom/airtrainer/apps/web/src/app/dashboard/search/page.tsx>)).