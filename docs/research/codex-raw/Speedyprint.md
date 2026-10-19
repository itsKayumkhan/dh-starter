## Project

**SpeedyPrint** is a custom printing storefront with an online designer, checkout, and order production workflow. It is one Next.js 15.3.6 App Router app with React 19, Supabase PostgreSQL (no ORM), Supabase Auth, Tailwind CSS 4 and Radix UI. State uses Zustand and admin React Query. It is not a monorepo (`package.json`, `src/app`).

## Reusable modules found

| Area | Finding and key paths |
|---|---|
| Auth | **Yes:** Supabase password signup/login, email confirmation callback/resend, reset, and SSR cookie sessions. No OAuth flow found. `src/hooks/useAuth.ts`, `src/components/auth/AuthProvider.tsx`, `src/app/api/auth/` |
| Roles/RBAC/permissions | **Yes:** customer/admin/production_staff roles, profile policies, JWT role sync, and server role checks. `supabase/migrations/001_initial_schema.sql`, `20260401001000_sync_roles_to_jwt.sql`, `src/lib/supabase/requireAdmin.ts` |
| Route protection/middleware | **Yes:** session refresh and route gates. `src/middleware.ts`, `src/lib/supabase/middleware.ts` |
| Admin panel/user management | **Yes:** dashboard, users, orders, content and settings; paginated user API. `src/app/admin/`, `src/app/api/admin/users/route.ts` |
| API pattern | **Route handlers** in `src/app/api/`; no Express or server-action pattern found. |
| Validation | **Partial:** Zod shipping schema in `src/app/(main)/checkout/page.tsx` and status enums in order routes; most API input checks are inline. |
| Error handling | **Partial:** `src/lib/utils/jsonError.ts`, `src/app/error.tsx`, `src/app/global-error.tsx`; `EmptyBatchError` in `src/lib/production/zipper.ts`. No shared ActionResult. |
| Env validation | **No schema:** direct `process.env` reads; names documented in `.env.local.example`. |
| Constants/routes config | **Partial:** `src/lib/utils/constants.ts`; admin route labels embedded in `src/app/admin/layout.tsx`. |
| Email | **Yes:** Resend with HTML templates. `src/lib/email/resend.ts`, `templates.ts` |
| File uploads/storage | **Yes:** validated upload route and Supabase Storage. `src/app/api/upload/route.ts`, `src/lib/upload.ts` |
| Payments | **Yes:** Stripe, PayFast and Switch checkout/webhooks; Stripe payment mode, with no subscription flow found. `src/app/api/checkout/`, `src/app/api/webhooks/`, `src/lib/payments/refund.ts` |
| Rate limiting | **Yes:** Upstash Redis sliding windows. `src/lib/rateLimit.ts`, `upstash.ts` |
| Logging | **Partial:** development logger and database audit log. `src/lib/utils/logger.ts`, `src/lib/audit.ts` |
| Notifications | **Yes:** audit-log feed and Sonner toasts. `src/app/api/notifications/route.ts`, `src/components/layout/NotificationBell.tsx` |
| PDF/certificates | **Yes for print PDFs:** generation/export pipeline; no general certificate module found. `src/lib/pdf/generator.ts`, `src/app/api/export/pdf/route.ts` |
| Search/pagination/tables | **Yes:** filtered, bounded admin queries and table UI. `src/app/api/admin/users/route.ts`, `src/components/ui/table.tsx` |
| Dashboard/analytics | **Yes:** order and revenue aggregates. `src/app/api/admin/dashboard/route.ts` |
| i18n | **No localization framework found** in `package.json` or `src/app`. |
| SEO | **Yes:** metadata, sitemap, robots, JSON-LD. `src/app/layout.tsx`, `sitemap.ts`, `robots.ts`, `src/components/seo/JsonLd.tsx` |
| Testing | **Yes:** Jest unit and Playwright end-to-end. `__tests__/unit/`, `tests/`, `jest.config.ts`, `playwright.config.ts` |
| CI/CD | **No workflow found** in the repository. |
| DB migrations/seeds | **Yes:** SQL migrations and seed scripts. `supabase/migrations/`, `supabase/seed.sql` |
| Cron/background jobs | **No scheduler found;** CSV/PDF jobs run on request. Dashboard GET triggers cleanup. `src/app/api/admin/dashboard/route.ts` |
| Realtime | **No Supabase realtime subscription found** in `src`. |

## Best pieces to extract

1. Supabase SSR client and layered role checks: useful starter access-control structure. `src/lib/supabase/server.ts`, `requireAdmin.ts`, `supabase/migrations/001_initial_schema.sql`
2. Password recovery endpoint: trusted redirect and neutral response limit account enumeration. `src/app/api/auth/reset-password/route.ts`
3. Stripe webhook: signature, amount check and event deduplication. `src/app/api/webhooks/stripe/route.ts`
4. Upload route: authentication, per-user limit, size/type checks and user-scoped storage path. `src/app/api/upload/route.ts`
5. Admin user listing: bounded pagination and sanitized search. `src/app/api/admin/users/route.ts`

## Anti-patterns to avoid

- Middleware skips auth checks when Supabase configuration is missing; rate limits allow requests when Redis is absent. `src/lib/supabase/middleware.ts`, `src/lib/rateLimit.ts`
- Default `requireAdmin()` also admits production staff, including to user-management APIs. Use explicit permissions per operation. `src/lib/supabase/requireAdmin.ts`, `src/app/api/admin/users/[id]/route.ts`
- Guest checkout access relies on knowing an order’s email; use a stronger guest token. `src/lib/checkout/ownership.ts`
- API validation and error responses vary by route; the Zod schema is mainly client-side. `src/app/(main)/checkout/page.tsx`, `src/app/api/admin/users/[id]/route.ts`
- Switch integration contains unconfirmed fields; PayFast lacks the Stripe webhook’s deduplication. `src/app/api/webhooks/switch/route.ts`, `payfast/route.ts`

## Project-specific (not reusable)

Printing prices, Fabric canvas tools, CSV variable-data production, proof approval, print PDFs, product catalogue, and BobGo courier logic: `src/lib/pricing/`, `src/lib/editor/`, `src/lib/production/`, `src/lib/gobob/`.