## Project

**Paradise Appliances** — appliance storefront with inventory, checkout, POS, and staff operations. Single Next.js **16.3.8** App Router project; Supabase Postgres with SQL migrations (no ORM), Supabase Auth and `@supabase/ssr`, Tailwind CSS 4 with shadcn/Base UI, and Zustand for cart and wishlist state. See `package.json`, `src/features/cart/store.ts`.

## Reusable modules found

- **Auth:** Email signup/login, confirmation callback, password reset, and cookie sessions use Supabase Auth. OAuth is absent. `src/lib/auth/actions.ts`, `src/app/auth/callback/route.ts`, `src/lib/supabase/server.ts`.
- **Roles/RBAC/permissions:** Profile roles and `staff_permissions` are checked in server code and Postgres RLS. `src/lib/auth/permissions.ts`, `src/lib/auth/session.ts`, `supabase/migrations/0030_permission_rls.sql`.
- **Route protection/middleware:** Next 16 `proxy.ts` refreshes sessions and guards paths; layouts and actions enforce staff permissions. `src/proxy.ts`, `src/app/admin/(panel)/layout.tsx`.
- **Admin panel/user management:** Staff invitation, roles, disabling, and removal. `src/app/admin/(panel)/users/page.tsx`, `src/lib/admin/staff-actions.ts`.
- **API pattern:** Primarily Server Actions; route handlers handle auth callback, webhooks, and cron. No Express. `src/lib/auth/actions.ts`, `src/app/api/webhooks/authnet/route.ts`.
- **Validation:** Zod at form and server boundaries, with schemas in feature files and `src/lib/*/schema.ts`; see `src/features/checkout/schema.ts`.
- **Error handling:** Result unions and route error boundaries; no shared error class system. `src/lib/auth/actions.ts`, `src/app/error.tsx`, `src/app/global-error.tsx`.
- **Env validation:** Eager public and lazy server Zod validation. `src/lib/env.ts`.
- **Constants/routes config:** Central route and site definitions. `src/lib/constants/routes.ts`, `src/lib/constants/site.ts`.
- **Email:** Resend sender and HTML templates. `src/lib/email/send.ts`, `src/lib/email/templates.ts`.
- **File uploads/storage:** Cloudinary image uploads for units, refunds, signatures, and handovers. `src/lib/cloudinary.ts`, `src/lib/deliveries/upload.ts`.
- **Payments:** Authorize.Net checkout, payment links, signed webhooks, and Stax POS; transaction based reconciliation. No subscriptions found. `src/lib/payments/`, `src/app/api/webhooks/authnet/route.ts`.
- **Rate limiting:** Shared Postgres buckets for auth attempts. `src/lib/auth/rate-limit.ts`, `supabase/migrations/0049_auth_rate_limits.sql`.
- **Logging:** Console errors plus database audit records; no centralized logger. `src/lib/admin/audit.ts`, `src/lib/email/send.ts`.
- **Notifications:** Account and staff database notifications, plus email. `src/lib/account/notifications.ts`, `src/lib/admin/notifications.ts`.
- **PDF/certificate generation:** No PDF or certificate generator found; invoices and receipts are printable HTML. `src/features/admin/documents/printable-document.tsx`.
- **Search/pagination/tables:** Admin typeahead, URL based pagination, shared table components. `src/lib/admin/global-search.ts`, `src/components/admin/pagination.tsx`, `src/components/ui/table.tsx`.
- **Dashboard/analytics:** Sales queries and Recharts views. `src/lib/admin/analytics.ts`, `src/features/admin/reports/reports-charts.tsx`.
- **i18n:** Absent; English locale is hardcoded in `src/app/layout.tsx`.
- **SEO:** Shared metadata, structured data, sitemap, and robots rules. `src/lib/seo/metadata.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`.
- **Testing:** Playwright browser and integration specs; no separate unit suite found. `tests/specs/`, `playwright.config.ts`.
- **CI/CD:** GitHub Actions runs scheduled jobs; no test or deploy workflow found. `.github/workflows/release-reservations.yml`.
- **DB migrations/seed scripts:** Numbered Supabase SQL migrations and Node seed scripts. `supabase/migrations/`, `scripts/seed-admin.mjs`.
- **Cron/background jobs:** Secret guarded route handlers scheduled by GitHub Actions. `src/app/api/cron/`, `.github/workflows/release-reservations.yml`.
- **Realtime:** No Supabase channel subscriptions found in `src/`.

## Best pieces to extract

1. **SSR auth boundary:** `src/lib/supabase/server.ts` and `src/proxy.ts` handle cookie refresh, protected paths, and safe server data access.
2. **Layered RBAC:** `src/lib/auth/session.ts` and `supabase/migrations/0030_permission_rls.sql` enforce permissions in actions and the database.
3. **Shared auth limiter:** `src/lib/auth/rate-limit.ts` and migration `0049_auth_rate_limits.sql` use atomic, cross-instance counters.
4. **Payment reconciliation pattern:** `src/app/api/webhooks/authnet/route.ts` and `src/lib/payments/record.ts` verify signatures and handle retries by transaction ID.
5. **Env accessors:** `src/lib/env.ts` validates public configuration and scopes server secrets to the feature that needs them.

## Anti-patterns to avoid

- `src/lib/auth/quick-login.ts` can grant a demo super-admin session wherever its override is enabled; keep this out of a production starter.
- `ActionResult` is redefined in `src/lib/auth/actions.ts`, `src/lib/account/address-actions.ts`, and other action files; share the type.
- `src/lib/admin/global-search.ts` converts query failures to empty results, hiding outages. `README.md` remains the default scaffold text.

## Project-specific (not reusable)

Appliance unit and SKU workflows, spreadsheet receiving, price tags, POS operations, commissions, and Paradise branding: `src/lib/inventory/`, `src/lib/labels.ts`, `src/features/admin/pos/`, `src/lib/commissions/`.

