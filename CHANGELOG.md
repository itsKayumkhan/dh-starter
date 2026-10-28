# Changelog

All notable changes to dh-starter. Versions follow semver (see `docs/STARTER_SYNC.md`).

## 0.4.0 (2026-10-28)

Security audit fixes (12-area audit; 1 Critical, 21 High addressed). Migration: `20261028120000_security_audit` (backfills `Inquiry` email statuses).

- Seed refuses production or remote databases and never changes existing accounts.
- Client IP comes only from trusted proxy hops (`TRUSTED_PROXY_HOPS`, default 0), so forwarded headers cannot bypass rate limits.
- Password reset revokes all sessions; public Better Auth admin and direct deletion endpoints return 404; account deletion needs email confirmation (works for Google-only users); production cookies are always Secure; profile updates are validated.
- Account deletion runs module cleanup first (`src/config/module-lifecycle.ts`, `onUserDelete` in billing and notifications): active Stripe subscriptions are canceled, notifications removed; a failing hook blocks deletion.
- Billing: one checkout reservation per user, webhook retries are never lost, older events cannot restore stale state, refunds cannot be overwritten, webhook body size cap.
- Uploads: size enforced server-side, pending upload tracking with a cleanup route, PDF structure checks, origin check on signing.
- CMS: database failures are never cached and editors cannot save fallback data; strict validation of email style values; optimistic concurrency.
- Notifications: idempotent broadcasts with a recipient cap; staff cannot target admins or everyone; per-user summary rate limit. Contact: single-use form tokens, separate email statuses.
- Admin: mutations and audit entries in one transaction; user detail loads active sessions only; unique account identity and new indexes.
- Platform: security headers (CSP, HSTS in production, frame and content-type protections), SMTP TLS and timeouts, rate-limit row cleanup, redacted dev email logs.
- Tooling: module-remove validates package names and owned paths, no shell; boundary checker resolves relative imports and honors dependsOn; db:dev removes only stale locks; CI runs Playwright against a local Postgres; e2e refuses non-local databases and CMS e2e restores content. `npm audit fix` applied.

## 0.3.0 (2026-10-23)

- Email layout visuals (font, colors, button radius) come from site settings and are editable in the CMS.
- Theme config in `src/config/site.ts`: default mode and allowed modes; the dashboard toggle renders only when more than one mode is allowed.
- `check:boundaries` allows project code in `src/features/` to import modules.
- `module:remove` stops when project code imports the module (lists file:line); `--force` overrides.
- Contact form: `useContactForm` hook plus a minimal default form.
- `format.ts` date and time formatters accept a time zone.
- Session route handlers rethrow Next control-flow errors.
- Removed: unused shadcn components (alert, calendar, collapsible, input-otp, pagination, radio-group, scroll-area, spinner, switch, chart), dashboard demo stats and chart, `docker-compose.yml`, default Next svgs, and the packages recharts, date-fns, clsx, tailwind-merge, input-otp, react-day-picker, @stripe/stripe-js, @stripe/react-stripe-js, @vitejs/plugin-react. Add a removed shadcn component back with `npx shadcn@latest add <name>`.
- Billing no longer reads `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

## 0.2.1 (2026-10-23)

- Local database: `npm run db:dev` now runs a real Postgres 17 through `embedded-postgres` (no Docker or system install) instead of `prisma dev`, which dropped connections under load. Data lives in `.data/postgres-<port>/`; the port, user and database come from `DATABASE_URL`. `SHADOW_DATABASE_URL` and `db:stop` are removed. Update `.env`: `DATABASE_URL="postgres://postgres:postgres@localhost:5433/dh_starter?sslmode=disable"`, then `npm run db:dev`, `npm run db:migrate`, `npm run db:seed`.
- Playwright: global setup resets local sign-in rate limit counters before a run; runs with one worker because specs share the seed accounts.

## 0.2.0 (2026-10-23)

- Core content layer: `prisma/schema/content.prisma` (SiteSetting, ContentBlock), `src/config/settings.ts`, `src/config/content.ts` registry, cached `getSiteSettings()` and `getContent()` with defaults when the database is empty or unavailable. Brand and contact data in UI, metadata and emails now come from site settings. Migration: `add_content`.
- New removable `cms` module (depends on `admin`): site settings editor (admin) and content block editor (admin, staff) with audit log and cache invalidation. New permission `content:write`.
- Session reads call `connection()` before Better Auth so cacheComponents treats them as request-time work.
- Font smoke test is design-neutral (checks the layout font is applied, not which font).
- Team rules: starter gives no UI/UX direction and the repo holds no suggestions; client-context and msg skills with a Node hook.

## 0.1.0 (2026-10-23)

First team release.

- Core: Next.js 16, Prisma 7 (multi-file schema, local `prisma dev`), Better Auth (email/password, verification, reset, Google OAuth, admin roles), Zod env validation with readable errors, `safeAction` + `ActionResult`, fail-closed Postgres rate limiter, audit log, logger, SEO helpers, deterministic formatters, branded React Email templates behind a Resend / SMTP / console adapter, 403 page, fail-fast production env check.
- Dashboard shell: sidebar, Ctrl+K command menu, theme toggle, server-paginated DataTable, shared components.
- Modules (removable with `npm run module:remove`): admin, uploads (Cloudinary), billing (Stripe), notifications, contact.
- Quality: boundary and circular checks, 85+ unit and component tests, Playwright e2e, CI on push and pull request.
- Team rules: `CLAUDE.md`, `.claude/settings.json`, `/verify`, `/new-module`, `/new-project`.
