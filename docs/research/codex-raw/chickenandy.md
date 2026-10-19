## Project

**ChickenAndy** is a curated live-streamer directory with owner, streamer, and viewer accounts. It is an npm workspaces monorepo: Next.js 15.1.4 App Router and React 19; Express 4 API; Supabase Postgres with Prisma 6.2.1; Supabase Auth; Tailwind 3.4; React Context/hooks and Socket.IO for live state. Sources: `package.json`, `apps/web/package.json`, `apps/api/package.json`.

## Reusable modules found

- **Auth:** Yes. Supabase handles email signup, confirmation, password login/reset, persistent browser sessions, and TOTP MFA. Kick OAuth connects an existing account; it is not social login. Paths: `apps/web/components/auth/AuthForm.tsx`, `ResetPasswordRoute.tsx`, `apps/web/lib/mfa.ts`, `apps/api/src/routes/connections.ts`.
- **Roles/RBAC and protection:** Yes. Admin is a Supabase `app_metadata` claim; streamer access derives from record ownership. Express verifies Bearer tokens and enforces admin/user gates. Next.js pages use client-side gates; no Next middleware. Paths: `apps/api/src/lib/auth.ts`, `apps/api/src/routes/admin.ts`, `apps/api/src/routes/me.ts`, `apps/web/components/admin/AdminGate.tsx`.
- **Admin/user management:** Yes. Streamer review, user listing, admin-role changes, and MFA reset. Paths: `apps/web/app/admin/`, `apps/api/src/routes/admin.ts`.
- **API, validation, errors:** Express REST routes, not server actions or Next route handlers. Zod schemas live beside routes, notably `apps/api/src/routes/me.ts`; `apps/api/src/lib/error-handler.ts` maps Prisma/Zod errors. No shared `ActionResult`, custom error class, or `error.tsx`.
- **Env and constants:** Partial production-only required-variable checks in `apps/api/src/lib/env.ts`; no schema validation. Platform metadata is centralized in `packages/shared/src/index.ts`; site URL in `apps/web/app/site-url.ts`; routes are mostly literal strings.
- **Email and uploads:** Supabase Auth email templates exist in `supabase/email-templates/`; no app mail-sending provider. Supabase Storage uses backend-issued signed upload URLs and bucket limits: `apps/api/src/routes/appearance.ts`, `account.ts`, `me.ts`, `apps/api/src/lib/storage-config.ts`.
- **Payments, PDF/certificates, i18n:** None found.
- **Rate limiting, logging, notifications:** `apps/api/src/lib/rate-limit.ts` uses per-IP Express limits; logging is `console` calls. Prisma-backed notifications are deduplicated and pushed over Socket.IO: `apps/api/src/lib/notifications.ts`, `ws/server.ts`.
- **Search, tables, analytics:** Client-side directory search and admin filters/tables; no general pagination component. Page-view collection and SQL platform-health summaries exist: `apps/web/components/site/NavSearch.tsx`, `apps/web/app/admin/users/page.tsx`, `apps/api/src/routes/analytics.ts`.
- **SEO, tests, delivery, jobs, realtime:** Metadata, static sitemap, and robots: `apps/web/app/layout.tsx`, `sitemap.ts`, `robots.ts`. Vitest unit tests exist under `apps/api/src/`; no e2e suite found. Vercel/Render configs exist; `.github/workflows/webpack.yml` is the only CI workflow found. Prisma schema and demo seed exist, but no migration files. The API process runs polling and daily retention; Socket.IO broadcasts directory, chat, and notifications: `apps/api/src/poller.ts`, `lib/retention.ts`, `ws/server.ts`.

## Best pieces to extract

1. [Auth gates and MFA session handling](<D:/coding/1_Adigital heroes/custom/chickenandy/apps/api/src/lib/auth.ts>) with `apps/web/lib/mfa.ts`: server authorization plus completed-session checks.
2. [OAuth connection flow](<D:/coding/1_Adigital heroes/custom/chickenandy/apps/api/src/routes/connections.ts>) with `lib/crypto.ts`: PKCE, single-use state, browser binding, and encrypted stored tokens.
3. [Signed upload flow](<D:/coding/1_Adigital heroes/custom/chickenandy/apps/api/src/routes/appearance.ts>) with `lib/storage-config.ts`: scoped upload tokens and image bucket limits.
4. [Notification service](<D:/coding/1_Adigital heroes/custom/chickenandy/apps/api/src/lib/notifications.ts>): persisted, deduplicated messages with live delivery.
5. [Analytics pipeline](<D:/coding/1_Adigital heroes/custom/chickenandy/apps/api/src/routes/analytics.ts>) with `lib/retention.ts`: bounded page-view collection, SQL aggregation, and retention.

## Anti-patterns to avoid

`apps/api/src/lib/env.ts` leaves several values unchecked and uses no typed schema. Upload signing and error responses are repeated across route files. `apps/api/src/routes/admin.ts` lists only the first 200 auth users; directory reads in `routes/streamers.ts` fetch all rows. `.github/workflows/webpack.yml` runs `npx webpack` rather than project build/tests and includes Node 18 despite the root Node ≥20 requirement. `apps/api/prisma/` has no committed migrations.

## Project-specific (not reusable)

Kick polling, chat webhooks, streamer ranking and moderation, platform branding, and ChickenAndy email/design assets: `apps/api/src/poller.ts`, `routes/kick-webhook.ts`, `packages/shared/src/index.ts`, `apps/web/app/globals.css`.