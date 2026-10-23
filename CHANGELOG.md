# Changelog

All notable changes to dh-starter. Versions follow semver (see `docs/STARTER_SYNC.md`).

## 0.1.0 (2026-10-23)

First team release.

- Core: Next.js 16, Prisma 7 (multi-file schema, local `prisma dev`), Better Auth (email/password, verification, reset, Google OAuth, admin roles), Zod env validation with readable errors, `safeAction` + `ActionResult`, fail-closed Postgres rate limiter, audit log, logger, SEO helpers, deterministic formatters, branded React Email templates behind a Resend / SMTP / console adapter, 403 page, fail-fast production env check.
- Dashboard shell: sidebar, Ctrl+K command menu, theme toggle, server-paginated DataTable, shared components.
- Modules (removable with `npm run module:remove`): admin, uploads (Cloudinary), billing (Stripe), notifications, contact.
- Quality: boundary and circular checks, 85+ unit and component tests, Playwright e2e, CI on push and pull request.
- Team rules: `CLAUDE.md`, `.claude/settings.json`, `/verify`, `/new-module`, `/new-project`.
