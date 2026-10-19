## Project

**PullNBangrz** — a live mystery bag catalogue with inventory, QR pulls, reviews, and an admin workspace. Single repo; Next.js 16.2.10 and React 19.2.4, Supabase Postgres without an ORM, Supabase Auth, Tailwind CSS 4, and React hooks/context for client state. [package.json](</D:/coding/1_Adigital heroes/custom/pullnbangrz/package.json>)

## Reusable modules found

| Area | Finding and key paths |
|---|---|
| Auth | **Partial:** email/password login, password change, sign-out, and cookie sessions via Supabase SSR. No signup, email verification flow, reset flow, or OAuth. [actions.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/features/auth/actions.ts>), [server.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/lib/supabase/server.ts>) |
| Roles/RBAC/permissions | **Partial:** `super_admin` and `business_admin` in `app_users`; tenant access enforced by Postgres RLS. No granular permission system. [schema.sql](</D:/coding/1_Adigital heroes/custom/pullnbangrz/supabase/schema.sql>), [guard.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/features/auth/guard.ts>) |
| Route protection/middleware | **Yes:** Next.js proxy refreshes sessions and gates `/admin`; protected layouts recheck the user. [proxy.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/proxy.ts>), [layout.tsx](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/app/(admin)/admin/(workspace)/layout.tsx>) |
| Admin panel/user management | **Partial:** dashboard and operational admin pages; no user management UI. [admin workspace](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/app/(admin)/admin/(workspace)>) |
| API pattern | **Yes:** feature-local Server Actions for mutations, route handlers for public submissions, upload signing, and PDFs. [collections/actions.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/features/collections/actions.ts>), [reviews/route.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/app/api/reviews/route.ts>) |
| Validation | **Yes:** Zod schemas beside features, plus shared ID and result helpers. [auth/schemas.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/features/auth/schemas.ts>), [validation](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/lib/validation>) |
| Error handling | **Yes:** typed `ActionResult`, Zod field errors, and an admin error boundary; no shared error-class hierarchy. [result.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/lib/validation/result.ts>), [error.tsx](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/app/(admin)/error.tsx>) |
| Env validation | **Yes:** separate client-safe and server-only Zod parsers. [env.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/lib/config/env.ts>), [env.server.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/lib/config/env.server.ts>) |
| Constants/routes | **Yes:** central route and message maps. [routes.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/lib/constants/routes.ts>) |
| Email | **No** application provider or templates found. |
| File uploads/storage | **Yes:** authenticated Cloudinary signatures; browser uploads directly, including bounded bulk uploads. [sign route](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/app/api/cloudinary/sign/route.ts>), [photo-upload.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/features/bulk-import/photo-upload.ts>) |
| Payments | **Schema only:** `subscriptions` has Stripe-labelled fields; no checkout, webhooks, or subscription workflow. [schema.sql](</D:/coding/1_Adigital heroes/custom/pullnbangrz/supabase/schema.sql>) |
| Rate limiting | **No** application rate limiter found, including on public review submission. [reviews/route.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/app/api/reviews/route.ts>) |
| Logging | **Minimal:** console logging; no structured logger or monitoring integration. [error.tsx](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/app/(admin)/error.tsx>) |
| Notifications | **UI only:** Sonner toasts; no push, email, or durable notification system. [layout.tsx](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/app/layout.tsx>) |
| PDF/certificates | **PDFs:** QR label sheets with `pdf-lib`, plus a guide-building script; no certificate generation workflow. [labels.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/features/qr/labels.ts>) |
| Search/pagination/tables | **Yes:** search helpers, client pagination, TanStack Table/virtualization in import review. Inventory queries cap results. [search.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/lib/search.ts>), [pagination.tsx](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/components/ui/pagination.tsx>), [ReviewGrid.tsx](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/features/bulk-import/components/ReviewGrid.tsx>) |
| Dashboard/analytics | **Operational dashboard:** tenant collection and inventory totals; no external analytics. [dashboard/queries.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/features/dashboard/queries.ts>) |
| i18n | **No** localization framework; English UI. [layout.tsx](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/app/layout.tsx>) |
| SEO | **Yes:** metadata, dynamic sitemap, robots, and OG image routes. [sitemap.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/app/sitemap.ts>), [robots.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/app/robots.ts>) |
| Testing | **Yes:** Node/tsx unit tests and one Playwright public smoke spec. [package.json](</D:/coding/1_Adigital heroes/custom/pullnbangrz/package.json>), [public.smoke.spec.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/tests/e2e/public.smoke.spec.ts>) |
| CI/CD | **Partial:** manual Vercel deployment script; no CI workflow found. [deploy.mjs](</D:/coding/1_Adigital heroes/custom/pullnbangrz/scripts/deploy.mjs>) |
| Migrations/seed | **Yes:** versioned SQL, seed data, apply/backup/verify scripts. [migrations](</D:/coding/1_Adigital heroes/custom/pullnbangrz/supabase/migrations>), [db-verify.mjs](</D:/coding/1_Adigital heroes/custom/pullnbangrz/scripts/db-verify.mjs>) |
| Cron/background jobs | **No** scheduled worker or cron configuration found. |
| Realtime | **Yes:** Supabase broadcast with debounced refresh and reconnect healing. [useCollectionChannel.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/lib/realtime/useCollectionChannel.ts>) |

## Best pieces to extract

1. [Supabase client split](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/lib/supabase>) and [proxy](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/proxy.ts>): clear public, session-bound, and privileged access paths.
2. [ActionResult helpers](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/lib/validation/result.ts>): consistent mutation and field-error contract.
3. [Environment parsers](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/lib/config>): validated client/server boundary.
4. [Cloudinary signing](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/lib/cloudinary/sign.ts>) and [bulk uploader](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/features/bulk-import/photo-upload.ts>): direct uploads with server-held secrets and concurrency control.
5. [Realtime hook](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/lib/realtime/useCollectionChannel.ts>): handles missed broadcasts through focus and reconnect refreshes.

## Anti-patterns to avoid

- [guard.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/features/auth/guard.ts>) defaults a missing profile to `business_admin`; a starter should reject incomplete membership explicitly.
- [cards/upload.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/features/cards/upload.ts>) and [bulk-import/photo-upload.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/features/bulk-import/photo-upload.ts>) repeat signing/upload mechanics.
- [reviews/route.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/app/api/reviews/route.ts>) accepts anonymous submissions without application rate limiting.
- [public.smoke.spec.ts](</D:/coding/1_Adigital heroes/custom/pullnbangrz/tests/e2e/public.smoke.spec.ts>) skips when fixture data is absent; that can hide a broken test environment.

## Project-specific (not reusable)

Mystery bag odds and rarity tiers, Pokémon card inventory/import rules, QR sticker and pull history workflows, branded public pages, and client-specific guide PDFs. [odds](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/features/odds>), [qr](</D:/coding/1_Adigital heroes/custom/pullnbangrz/src/features/qr>)

