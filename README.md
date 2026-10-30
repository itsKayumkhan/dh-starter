# DH Starter

Reusable Next.js full-stack starter for Digital Heroes projects. Every client or internal project starts as a copy of this repo: auth, roles, email, uploads, payments, CMS, admin, security and tests are already built and tested, and each project adds its own features and design on top.

Created and maintained by **Kayum Khan** ([itsKayumkhan](https://github.com/itsKayumkhan)) for **Digital Heroes**.

Version: see [`STARTER_VERSION`](STARTER_VERSION) and [`CHANGELOG.md`](CHANGELOG.md).

## Contents

1. [Tech stack](#1-tech-stack)
2. [Features](#2-features)
3. [Modules](#3-modules)
4. [Requirements](#4-requirements)
5. [Quick start](#5-quick-start)
6. [Environment variables](#6-environment-variables)
7. [Scripts](#7-scripts)
8. [Project structure](#8-project-structure)
9. [Starting a client project](#9-starting-a-client-project)
10. [Adding and removing modules](#10-adding-and-removing-modules)
11. [Testing and quality](#11-testing-and-quality)
12. [Security defaults](#12-security-defaults)
13. [Working with Claude Code](#13-working-with-claude-code)
14. [Documentation](#14-documentation)
15. [Credits](#15-credits)

## 1. Tech stack

| Layer         | Choice                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router, Cache Components), React 19, TypeScript strict                         |
| Database      | PostgreSQL through Prisma 7 (multi-file schema in `prisma/schema/`)                            |
| Local DB      | Real Postgres 17 from the `embedded-postgres` package (no Docker, no system install)           |
| Auth          | Better Auth (email and password, email verification, password reset, Google OAuth, roles)      |
| Validation    | Zod at every boundary (forms, actions, route handlers, params, env)                            |
| Forms         | react-hook-form with the Zod resolver                                                          |
| UI            | Tailwind CSS 4, shadcn/ui, Lucide icons (placeholder look; each project brings its own design) |
| Tables, state | TanStack Table, TanStack Query (dashboard only), nuqs for URL state                            |
| Email         | React Email templates, provider adapter: Resend, SMTP or console (development only)            |
| Uploads       | Cloudinary signed uploads (`next-cloudinary`, `cloudinary`)                                    |
| Payments      | Stripe Checkout, subscriptions, customer portal, webhooks                                      |
| Tests         | Vitest and Testing Library (unit and component), Playwright (end to end)                       |
| CI            | GitHub Actions                                                                                 |

## 2. Features

### Authentication and accounts

- Sign up, sign in, sign out, remember me.
- Email verification with resend.
- Forgot and reset password; the forgot response never reveals whether an email exists; a reset revokes every existing session.
- Google sign-in, shown only when its keys are set.
- Account page: profile, password change, active sessions with revoke one or all others, account deletion confirmed by email (also works for Google-only accounts).
- Banned users are blocked.

### Roles and permissions

- Roles `user`, `staff`, `admin`; permissions defined once in `src/lib/auth/permissions.ts` and checked with `can(user, "users:read")`.
- Server-side guards on every protected page, server action and route handler; a branded 403 page when access is denied.
- Every guard fails closed: missing config, a failed database call or an unknown role means deny.

### Core helpers

- `safeAction()` and `ActionResult`: validation, auth, permission and rate limit in one wrapper for server actions.
- `DataTable` and `parseListParams`: server-side pagination, search, sort and filters stored in the URL.
- Postgres rate limiter, atomic and fail closed, with trusted-proxy client IP handling.
- Audit log (`writeAudit`), structured logger that redacts secrets.
- `src/lib/format.ts`: deterministic date and number formatting with locale and time zone.
- SEO: `buildMetadata()`, sitemap (includes public routes of installed modules), robots, JSON-LD.
- Readable environment validation errors; an invalid production configuration stops the server at boot.
- Security headers: CSP, HSTS in production, frame, referrer, content-type and permissions policies.

### Email

- `sendEmail()` with the provider chosen by `EMAIL_PROVIDER` (`resend`, `smtp`, `console`); SMTP uses TLS in production.
- Branded HTML templates (verify email, reset password, welcome, invite, notification, account deletion); fonts, colors and button style come from site settings.
- `npm run email:dev` previews the templates.

### Content and settings

- `getSiteSettings()`: brand name, logo, contact details, social links, SEO defaults and email style; database values override `src/config/site.ts` defaults.
- `getContent("<page>.<section>")`: typed content blocks registered in `src/config/content.ts` with a Zod schema, a default value and editor fields.
- Reads are cached and refreshed on save; pages render their defaults when the database is empty or unavailable.

### Dashboard shell

- Sidebar navigation filtered by permission, breadcrumbs, Ctrl+K command menu, user menu.
- Light, dark and system theme, configured in `src/config/site.ts` (default mode and allowed modes).

## 3. Modules

Removable features in `src/modules/<id>/`. Remove one with `npm run module:remove -- <id>`.

| Module          | What it provides                                                                                                                                      | Env keys                                                                                                                              | Depends on |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `admin`         | User list, role change, ban and unban, revoke sessions, invite, delete, audit log page                                                                | none                                                                                                                                  | none       |
| `cms`           | Site settings editor (admin), content block editor with auto-generated forms (admin, staff), concurrency checks                                       | none                                                                                                                                  | `admin`    |
| `uploads`       | Cloudinary signed uploads with server-side type and size checks, media library, image picker, abandoned upload cleanup                                | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER_PREFIX`, `UPLOADS_CRON_SECRET` | none       |
| `billing`       | Stripe Checkout (subscription and one-time), customer portal, idempotent webhooks, pricing page, payment history, admin payments                      | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`                                                                                          | none       |
| `notifications` | In-app notifications, header bell, optional email, admin broadcast to a user, a role or everyone                                                      | none                                                                                                                                  | none       |
| `contact`       | Contact form with honeypot, single-use timing token and rate limit, branded emails to the business and the sender, admin inbox, `useContactForm` hook | `CONTACT_NOTIFY_EMAIL`                                                                                                                | none       |

When a user is deleted, modules that store user data clean up first (billing cancels active Stripe subscriptions, notifications removes the user's notifications); a failing cleanup stops the deletion.

## 4. Requirements

- Node.js 24 and npm.
- Nothing else for local development: the database runs from npm.

## 5. Quick start

```bash
npm install
cp .env.example .env
npm run db:dev        # in its own terminal; Ctrl+C to stop
npm run db:migrate
npm run db:seed
npm run dev           # http://localhost:3000
```

- `db:dev` starts Postgres for the `DATABASE_URL` in `.env` (default `localhost:5433`, database `dh_starter`) and keeps its data in `.data/`. Run it again after a restart. Each project copy uses its own port and database name in `DATABASE_URL`.
- Development seed logins (local and staging only; the seed refuses production and remote databases):

| Role  | Email                | Password            |
| ----- | -------------------- | ------------------- |
| admin | admin@dhstarter.test | DhStarter@Admin2026 |
| staff | staff@dhstarter.test | DhStarter@Staff2026 |
| user  | user@dhstarter.test  | DhStarter@User2026  |

## 6. Environment variables

All keys are listed with a comment in [`.env.example`](.env.example). Module keys are only required when that module is installed.

| Key                                                                                                            | Required                       | Purpose                                                                   |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------- |
| `DATABASE_URL`                                                                                                 | yes                            | PostgreSQL connection string                                              |
| `BETTER_AUTH_SECRET`                                                                                           | yes                            | Session signing secret, at least 32 characters                            |
| `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`                                                                       | yes                            | Public origin of the app                                                  |
| `EMAIL_PROVIDER`, `EMAIL_FROM`                                                                                 | yes                            | Email transport (`resend`, `smtp`, `console` in development) and sender   |
| `RESEND_API_KEY`                                                                                               | with Resend                    | Resend API key                                                            |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`                                              | with SMTP                      | SMTP server; user and password must be set together                       |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                                                                     | optional                       | Google sign-in; both or neither                                           |
| `TRUSTED_PROXY_HOPS`                                                                                           | production                     | Number of trusted proxies in front of the app, used to read the client IP |
| `SEED_CONFIRM_REMOTE`                                                                                          | only for remote seeding        | Confirmation phrase required with `--allow-remote`                        |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER_PREFIX` | `uploads` module               | Cloudinary account and folder prefix                                      |
| `UPLOADS_CRON_SECRET`                                                                                          | `uploads` module in production | Bearer secret for `GET /api/uploads/cleanup`                              |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`                                                                   | `billing` module               | Stripe secret key and webhook signing secret                              |
| `CONTACT_NOTIFY_EMAIL`                                                                                         | optional, `contact` module     | Inbox for inquiries (falls back to the support email in settings)         |
| `CONTACT_E2E_DELIVERY`                                                                                         | optional                       | `1` lets the contact e2e spec send through the configured email provider  |

## 7. Scripts

| Script                                        | Purpose                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`, `build`, `start`               | Next.js development server, production build, production server         |
| `npm run lint`, `typecheck`, `format`         | ESLint, TypeScript check, Prettier                                      |
| `npm run check:boundaries`                    | Core must not import modules; modules only import declared dependencies |
| `npm run check:circular`                      | No circular imports, including type-only ones                           |
| `npm run check:module-tests`                  | Every module logic file has a unit test and every module an e2e spec    |
| `npm run test`                                | Unit and component tests (Vitest)                                       |
| `npm run test:e2e`                            | Browser tests (Playwright); needs `db:dev` and a local database         |
| `npm run db:dev`                              | Local Postgres 17                                                       |
| `npm run db:migrate`                          | Create and apply a migration (`-- --name <what>`)                       |
| `npm run db:generate`, `db:seed`, `db:studio` | Prisma client, seed logins, Prisma Studio                               |
| `npm run db:reset`                            | Drop and recreate the local database (asks before running)              |
| `npm run module:list`, `module:remove`        | Inspect and remove modules                                              |
| `npm run email:dev`                           | Email template preview                                                  |

## 8. Project structure

```
prisma/
  schema/                 base, auth, core, content + one file per module
  migrations/             every schema change, committed with the schema
  seed.mts                development seed logins
scripts/                  db-dev, module-list, module-remove, check-boundaries
src/
  app/                    routes only: (marketing), (auth), (dashboard)/dashboard, (dashboard)/admin, api
  components/
    ui/                   shadcn primitives
    shared/               DataTable, PageHeader, EmptyState, ConfirmDialog, StatCard
    layout/               dashboard shell, navigation
    auth/                 auth forms
  config/
    site.ts               brand defaults and theme config
    settings.ts           editable site settings schema
    content.ts            content block registry
    modules.ts            installed modules (nav, header items, public routes)
    module-lifecycle.ts   user deletion hooks of installed modules
  features/               project-specific code (account settings in the starter)
  lib/                    env, db, auth, errors, safe-action, rate-limit, audit, logger, email, seo, format, pagination, content
  modules/<id>/           module.json, module.ts, env.ts, routes.ts, server/, components/, schemas/, README.md
  proxy.ts                optimistic redirect for signed-out users (real checks are server-side)
tests/
  e2e/                    Playwright specs
.claude/                  team commands, skills, hook and settings
docs/                     architecture, modules, performance, production checklist, starter sync
```

## 9. Starting a client project

The starter lives at `github.com/itsKayumkhan/dh-starter` (private template repository). A project is an independent copy: it never pushes to, pulls from or stays connected to the starter repo.

1. Create the project repository from the starter. Either:
   - **From GitHub (no link to the starter):**
     ```bash
     gh repo create <owner>/<project> --private --template itsKayumkhan/dh-starter --clone
     cd <project>
     ```
   - **From a local clone (cut the connection before any work):**
     ```bash
     git clone https://github.com/itsKayumkhan/dh-starter.git <project>
     cd <project>
     git remote remove origin
     git remote add origin https://github.com/<owner>/<project>.git
     ```
     `git remote -v` must show only the project repository, never `dh-starter`.
     Then run `npm install` and copy `.env.example` to `.env`.
2. Open it in Claude Code and run `/new-project <name> <domain>`. It confirms the modules to keep and removes the others, sets brand defaults in `src/config/site.ts`, gives the project its own local database in `DATABASE_URL`, changes the seed logins to the project domain, records the starter version in `STARTER_VERSION`, and runs `/verify`.
3. Apply the project's own design: the starter look is a placeholder.
4. Fill the real keys in `.env` for the modules kept.
5. Commit and push to the project repository only.
6. Before go-live, complete every item in [`docs/PRODUCTION_CHECKLIST.md`](docs/PRODUCTION_CHECKLIST.md).

## 10. Adding and removing modules

- Add: `/new-module <id> <purpose>` in Claude Code (manifest, registry lines, env keys, tests). Contract in [`docs/MODULES.md`](docs/MODULES.md).
- Remove:

```bash
npm run module:remove -- <id> --dry-run   # shows every file, package and env key to remove
npm run module:remove -- <id>
npm run db:migrate -- --name remove_<id>   # when the module had tables
```

Removal stops when project code still imports the module (file and line are listed); `--force` overrides it. It also stops when another installed module depends on it.

## 11. Testing and quality

- Unit and component tests next to the code (`*.test.ts`, `*.test.tsx`).
- Playwright specs in `tests/e2e/`; they run only against a localhost app and a local database, and specs that need Stripe, Cloudinary or a real email provider skip with a reason when the keys are missing.
- `/verify` in Claude Code runs typecheck, lint, boundary, cycle and module-test checks, unit tests and the build (`/verify e2e` adds Playwright).
- CI (`.github/workflows/ci.yml`) on every push and pull request: lint, typecheck, boundary and cycle checks, unit tests, then a local Postgres, migrate, seed, build and Playwright.
- Pre-commit hook (Husky and lint-staged): Prettier and ESLint on staged files.
- Bundle budget and measurement method: [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md).

## 12. Security defaults

- Server-side authorization on every protected page, action and route handler; the proxy is only a redirect.
- Guards, rate limits and module cleanup fail closed.
- Secrets stay on the server; only `NEXT_PUBLIC_*` values reach the browser.
- Uploads are signed and verified on the server; Stripe webhooks verify the signature and claim each event once.
- Client IP is read only through trusted proxy hops, so forwarded headers cannot bypass rate limits.
- Production cookies are always Secure; security headers are set in `next.config.ts`.
- The seed refuses production and remote databases and never changes existing accounts.
- Every DDL change is a committed migration; the schema files and `prisma/migrations/` are the schema backup.

## 13. Working with Claude Code

- [`CLAUDE.md`](CLAUDE.md) is the team rulebook; Claude Code loads it in every session, Codex and other agents read it through [`AGENTS.md`](AGENTS.md).
- `.claude/settings.json` allows the safe checks without prompts, asks before reading `.env`, and blocks destructive commands (database reset, force push, hard reset). Personal overrides go in `.claude/settings.local.json` (gitignored).
- Commands:
  - `/verify` or `/verify e2e`: runs every check and reports the real results.
  - `/new-module <id> <purpose>`: scaffolds a removable module.
  - `/new-project <name> <domain>`: turns a fresh copy into a client project.
- Skills:
  - `/client-context`: turns the client chat (base chat file at the project root plus later Fiverr or WhatsApp messages) into `docs/project/`. Image-only PDF chats need `pip install pymupdf` once.
  - `/msg`: client messages and emails in the team writing style.
- Hook `.claude/hooks/client-context-check.mjs`: points Claude to `/client-context` when a chat file changes or chat is pasted, and asks once to update `docs/project/` after code changes in a client project.

## 14. Documentation

| File                                                           | Contents                                                         |
| -------------------------------------------------------------- | ---------------------------------------------------------------- |
| [`CLAUDE.md`](CLAUDE.md)                                       | Team rules for Claude Code                                       |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)                 | Folder layout, module contract, content layer, security defaults |
| [`docs/MODULES.md`](docs/MODULES.md)                           | Module manifest, adding and removing modules, email provider     |
| [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md)                   | Bundle budget, current numbers, how to measure                   |
| [`docs/PRODUCTION_CHECKLIST.md`](docs/PRODUCTION_CHECKLIST.md) | Everything to change before go-live                              |
| [`docs/STARTER_SYNC.md`](docs/STARTER_SYNC.md)                 | Porting fixes between projects and the starter                   |
| [`CHANGELOG.md`](CHANGELOG.md)                                 | Changes per starter version                                      |
| `src/modules/<id>/README.md`                                   | Setup and env keys of each module                                |

## 15. Credits

- **Author:** Kayum Khan ([github.com/itsKayumkhan](https://github.com/itsKayumkhan)), who designed and built dh-starter and maintains it.
- **Made for:** Digital Heroes, whose client and internal projects start from this repo.

Projects created from the starter keep this credit in their `README.md`.
