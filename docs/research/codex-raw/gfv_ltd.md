## Project

**GFV / EV Buyer**, UK electric-vehicle quote capture and lead-management site. Next.js 15.5.27 App Router, React 19, Supabase Postgres via `postgres` (no ORM), custom bcrypt/HMAC-cookie auth, Tailwind CSS 4 and Radix UI. State uses React hooks, `useActionState`, and React Hook Form; single app, not a monorepo. Sources: `package.json`, `src/lib/constants/site.ts`.

## Reusable modules found

- **Auth, Yes:** Admin login, password reset, user-created accounts, and signed sessions; no public signup, email verification, or OAuth. `src/features/admin/actions/auth.ts`, `src/lib/auth/session.ts`.
- **Roles/RBAC, Yes:** Owner/admin/staff permission grants. `src/lib/auth/rbac.ts`.
- **Route protection, Yes:** `/admin` middleware plus server-side page/action checks. `src/middleware.ts`, `src/lib/auth/session.ts`.
- **Admin/user management, Yes:** Users, leads, content, media, settings. `src/features/admin/users/actions/users.ts`, `src/app/admin/(panel)/`.
- **API pattern, Yes:** Server Actions for admin mutations; route handlers for leads, files, webhooks, and cron. `src/features/admin/actions/leads.ts`, `src/app/api/leads/route.ts`.
- **Validation, Yes:** Zod schemas beside features. `src/features/quote/schemas/lead.ts`, `src/features/admin/schemas/actions.ts`.
- **Error handling, Yes:** Typed auth errors, `ActionResult`, error boundaries. `src/lib/auth/session.ts`, `src/features/admin/types.ts`, `src/app/error.tsx`.
- **Env validation, Yes:** Central Zod parse. `src/lib/env.ts`.
- **Constants/routes, Yes:** Central route and site configuration. `src/lib/constants/routes.ts`, `src/lib/constants/site.ts`.
- **Email, Yes:** Resend adapter and HTML/text templates; console fallback. `src/lib/email/email-service.ts`, `src/features/email/templates/`.
- **Uploads/storage, Yes:** Local/Supabase adapters, image signature checks, signed URLs. `src/lib/storage/file-storage.ts`, `src/lib/storage/upload-rules.ts`.
- **Payments, No:** No checkout, payment webhook, or billing implementation.
- **Rate limiting, Yes:** Upstash REST with in-memory fallback and trusted-client-IP rules. `src/lib/security/rate-limiter.ts`, `src/lib/security/client-ip.ts`.
- **Logging, Basic:** `console` calls; no structured logging service. `src/lib/email/email-service.ts`, `src/features/quote/server/submit-lead.ts`.
- **Notifications, Yes:** Lead/quote email and WhatsApp; no in-app notification system. `src/features/quote/server/lead-notifications.ts`, `src/lib/whatsapp/cloud-api.ts`.
- **PDF/certificates, No:** No generator found.
- **Search/pagination/tables, Yes:** URL filters, paged lead repository, table UI. `src/features/admin/schemas/filters.ts`, `src/features/admin/components/leads-table.tsx`.
- **Dashboard/analytics, Yes:** Lead reports and consent-gated GTM. `src/app/admin/(panel)/reports/page.tsx`, `src/features/consent/components/gtm-loader.tsx`.
- **i18n, No:** English/UK-specific copy and formatting.
- **SEO, Yes:** Metadata helper, sitemap, robots, share images. `src/lib/seo.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`.
- **Testing, Partial:** Python Playwright E2E scripts; no unit-test setup found. `tests/e2e/`.
- **CI/CD, Partial:** Vercel config; no CI workflow found. `vercel.json`.
- **Migrations/seeds, Yes:** SQL migrations and nonproduction demo-lead seeding. `supabase/migrations/`, `src/lib/db/leads.ts`.
- **Cron/jobs, Yes:** Daily authenticated pending-upload purge. `vercel.json`, `src/app/api/cron/purge-pending-photos/route.ts`.
- **Realtime, No:** No realtime subscription implementation found.

## Best pieces to extract

1. **Permission model and repeated authorization checks:** [rbac.ts](<D:/coding/1_Adigital heroes/custom/gfv_ltd/src/lib/auth/rbac.ts>), [session.ts](<D:/coding/1_Adigital heroes/custom/gfv_ltd/src/lib/auth/session.ts>), clear grants and server-side enforcement.
2. **Upload rules:** [upload-rules.ts](<D:/coding/1_Adigital heroes/custom/gfv_ltd/src/lib/storage/upload-rules.ts>), MIME sniffing, size checks, safe keys, expiring URLs.
3. **Environment schema:** [env.ts](<D:/coding/1_Adigital heroes/custom/gfv_ltd/src/lib/env.ts>), one validated server configuration boundary.
4. **Rate limiter and IP handling:** [rate-limiter.ts](<D:/coding/1_Adigital heroes/custom/gfv_ltd/src/lib/security/rate-limiter.ts>), [client-ip.ts](<D:/coding/1_Adigital heroes/custom/gfv_ltd/src/lib/security/client-ip.ts>), reusable interfaces and explicit proxy trust.
5. **Consent flow:** [consent-store.ts](<D:/coding/1_Adigital heroes/custom/gfv_ltd/src/features/consent/lib/consent-store.ts>), stored choices and tracking updates.

## Anti-patterns to avoid

- Admin lead/report queries start **before** session authorization: `src/app/admin/(panel)/leads/page.tsx`, `reports/page.tsx`.
- Unconfigured email logs a message but returns success, so quote UI can claim delivery: `src/lib/email/email-service.ts`, `src/features/admin/actions/leads.ts`.
- Missing database configuration selects a JSON store that is ephemeral on Vercel: `src/lib/db/leads.ts`, `src/lib/db/json-store.ts`.
- Error-to-result mapping is repeated across actions: `src/features/admin/actions/leads.ts`, `content.ts`, `src/features/media/actions/media.ts`.

## Project-specific (not reusable)

EV valuation forms and copy, vehicle-photo workflow, GBP quote rules, WhatsApp quote wording, and GFV branding: `src/features/quote/`, `src/features/landing-tesla/`, `src/lib/constants/site.ts`.

