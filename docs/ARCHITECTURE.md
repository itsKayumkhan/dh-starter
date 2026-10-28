# dh-starter architecture

Reusable Next.js full-stack starter for Digital Heroes projects. Clone it, set env, remove the modules a project does not need, build the project-specific features on top.

## Stack

| Layer               | Choice                                                                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework           | Next.js 16 App Router, React 19, TypeScript strict                                                                                                                                                                                   |
| Database            | PostgreSQL through **Prisma 7** (driver adapter `@prisma/adapter-pg`). Local: `npm run db:dev` (real Postgres 17 from the `embedded-postgres` package, no Docker). Cloud: Supabase, Neon, any Postgres. Only `DATABASE_URL` changes. |
| Auth                | **Better Auth** with Prisma adapter (email/password, email verification, password reset, Google OAuth, sessions in DB)                                                                                                               |
| Validation          | Zod 4 at every boundary                                                                                                                                                                                                              |
| Forms               | react-hook-form + `@hookform/resolvers/zod` + shadcn `field` components                                                                                                                                                              |
| UI                  | Tailwind 4, shadcn/ui (radix-nova), Lucide icons, Sonner toasts, next-themes                                                                                                                                                         |
| Tables / URL state  | TanStack Table + nuqs (server pagination, filters in URL)                                                                                                                                                                            |
| Client server-state | TanStack Query (only where client fetching is really needed)                                                                                                                                                                         |
| Email               | provider adapter: Resend, SMTP (nodemailer), console (dev only). Templates in React Email.                                                                                                                                           |
| Uploads             | Cloudinary signed uploads (next-cloudinary)                                                                                                                                                                                          |
| Payments            | Stripe (Checkout, subscriptions, customer portal, idempotent webhooks)                                                                                                                                                               |
| Tests               | Vitest (unit), Playwright (e2e)                                                                                                                                                                                                      |
| CI                  | GitHub Actions: lint, typecheck, boundary and cycle checks, unit tests, then a local Postgres (db:dev), migrate, seed, build and Playwright e2e                                                                                      |

## Core vs modules

**Core** is always present and never imports from a module.

**Modules** live in `src/modules/<id>/` and can be deleted with `npm run module:remove <id>`.

```
prisma/
  schema/
    base.prisma            core: generator + datasource
    auth.prisma            core: User, Session, Account, Verification (Better Auth) + role, banned
    core.prisma            core: RateLimit, AuditLog
    <module>.prisma        one file per module that needs tables
  migrations/
  seed.ts
prisma.config.ts

src/
  proxy.ts                 optimistic session gate (Next 16 replacement for middleware.ts)
  app/
    (marketing)/           public pages
    (auth)/                login, signup, forgot-password, reset-password, verify-email
    (dashboard)/dashboard/ signed-in area, uses DashboardShell
    (dashboard)/admin/     admin area (admin module pages)
    api/auth/[...all]/     Better Auth handler
    api/<module>/...       module route handlers (webhooks etc.)
    error.tsx, global-error.tsx, not-found.tsx, loading.tsx
    sitemap.ts, robots.ts
  config/
    site.ts                brand: name, url, description, logo, colors, support email, address
    modules.ts             lists installed modules (nav items, header items, public routes)
    module-lifecycle.ts    user deletion hooks of installed modules
  lib/
    env/                   server.ts (server-only), client.ts (NEXT_PUBLIC_)
    constants/             routes.ts, messages.ts, app.ts
    db.ts                  Prisma singleton
    errors.ts              AppError, UnauthorizedError, ForbiddenError, NotFoundError, ValidationError, RateLimitError
    action-result.ts       ActionResult<T>, ok(), fail(), fromZodError()
    safe-action.ts         safeAction({ schema, auth, permission, rateLimit }, handler)
    rate-limit.ts          Postgres atomic limiter, fails CLOSED
    audit.ts               writeAudit({ actorId, action, target, meta })
    logger.ts              tiny structured logger (no PII)
    seo.ts                 buildMetadata(), JSON-LD helpers
    email/                 sendEmail() + providers/{resend,smtp,console}.ts + templates/
    auth/
      server.ts            betterAuth() instance
      client.ts            createAuthClient()
      session.ts           getSession(), requireUser(), requireRole(), requirePermission()
      permissions.ts       ROLES, PERMISSIONS, can(user, permission)
  modules/
    <id>/
      module.json          manifest used by module:remove
      module.ts            export const <id>Module: AppModule (id, name, nav items)
      env.ts               this module's env schema, validated lazily on first use
      server/              data access + server actions
      components/
      schemas/
      README.md            setup, env keys, how to remove
  components/
    ui/                    shadcn primitives (do not hand-edit unless restyling)
    shared/                cross-feature components
    layout/                DashboardShell, header, theme toggle
```

## Module contract

`src/modules/<id>/module.json`:

```json
{
  "id": "billing",
  "name": "Stripe billing",
  "description": "Checkout, subscriptions, customer portal, webhooks",
  "paths": [
    "src/modules/billing",
    "src/app/api/billing",
    "src/app/(dashboard)/dashboard/billing"
  ],
  "prismaFiles": ["prisma/schema/billing.prisma"],
  "packages": ["stripe"],
  "envKeys": ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
  "dependsOn": []
}
```

`src/config/modules.ts` imports each module's `module.ts` on a line ending with `// module:<id>` and lists it in `installedModules` on a line ending with `// module:<id>`. `scripts/module-remove.mts` deletes `paths` + `prismaFiles`, removes those marked lines, removes `envKeys` from `.env.example`, and runs `npm uninstall` for `packages` not used elsewhere. Then the dev runs `npx prisma migrate dev` to drop the tables.

Module rules:

- A module imports from core (`@/lib`, `@/components`, `@/config/site`) and never from another module, unless listed in `dependsOn`.
- A module's env keys are validated inside `src/modules/<id>/env.ts`, lazily, so a project without that module never needs those keys.
- Core never imports a module. The only links are `src/config/modules.ts` and `src/config/module-lifecycle.ts`.

## Swappable providers (no lock-in)

- Email: `EMAIL_PROVIDER=resend|smtp|console`. Providers registered in `src/lib/email/providers/index.ts`. To drop Resend: delete `providers/resend.ts`, remove its line from the index, `npm uninstall resend`. `console` refuses to run when `NODE_ENV=production`.
- Database: any Postgres via `DATABASE_URL`.
- Uploads: `src/modules/uploads/server/storage.ts` interface, Cloudinary implementation.

## Security defaults (from the 17-project scan)

- Every guard fails closed: missing config, failed DB call or unknown role means deny.
- Auth is re-checked on the server in every action, route handler and protected layout. `proxy.ts` is UX only.
- Rate limiting is Postgres based and atomic, so it works on serverless.
- Stripe webhooks: verify signature, claim `event.id` in `WebhookEvent` (unique), process, mark done; a failed run releases the claim so Stripe retries.
- Uploads are always signed; type and size checked on the server.
- Admin lists paginate on the server.
- No dev backdoors. Seed logins exist only through `prisma/seed.mts` and are listed in `docs/PRODUCTION_CHECKLIST.md`.

## Seed logins (dev only)

| Role  | Email                | Password            |
| ----- | -------------------- | ------------------- |
| admin | admin@dhstarter.test | DhStarter@Admin2026 |
| staff | staff@dhstarter.test | DhStarter@Staff2026 |
| user  | user@dhstarter.test  | DhStarter@User2026  |

## Core content and CMS

Content reading is core so public marketing pages never import a removable module. `prisma/schema/content.prisma` contains `SiteSetting` and `ContentBlock`, both keyed JSON records. `src/config/settings.ts` defines editable site settings and validation; `src/config/content.ts` is the typed project-specific content registry with schemas, defaults and editor field definitions. `src/lib/content/settings.ts` and `src/lib/content/blocks.ts` validate stored values, fall back to defaults for missing or unavailable data, and cache reads with `use cache`, `cacheLife` and tags. Mutations invalidate `site-settings` or `content:<key>` with `updateTag`.

The removable `cms` module depends on `admin` and owns `/admin/cms/settings` and `/admin/cms/content`. Admins edit settings and blocks; staff edit blocks; regular users cannot access the editors. CMS actions use `safeAction`, Zod validation, audit records and cache invalidation. The module has no database tables of its own. Removing CMS deletes the editor, while core content reads, database records and public defaults remain. The editor accepts public image URLs; an uploads integration requires an explicit module dependency.
