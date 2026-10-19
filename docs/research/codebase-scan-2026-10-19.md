# Custom projects scan: what the starter should contain

Date: 2026-10-19
Source: 17 projects in `D:\coding\1_Adigital heroes\custom`, each audited read-only by Codex CLI (raw reports in `codex-raw/`).

Projects scanned: Coremxtraining, Jeremiah (Paradise Appliances), Speedyprint, StoryHorde, Uberlesson, airtrainer, aryefeuerstein (EZ Returns), booking (Domia), chickenandy, gfv_ltd (EV Buyer), griffiths-crm, nimbly, patrick, planivo-role-manager, pullnbangrz, stmevents, thrillpay.

Skipped: Vite-only or empty folders (Obligo, pdfCertificate, theberman, vital-loop-health, cover, inaya, qr-golf, thesharkkingl, luxerywatch draft).

---

## 1. What the stack actually is (by count)

| Area | What we use | Count (of 17) |
|---|---|---|
| Framework | Next.js App Router | 13 (rest: Vite SPA, Express, Hono) |
| DB + Auth | **Supabase** (Postgres + Auth, SQL migrations, no ORM) | ~11 |
| | Prisma + Postgres | 4 (Coremx, patrick, Uberlesson, chickenandy) |
| | Custom bcrypt/cookie auth | 2 (gfv, patrick) |
| | Better Auth + Drizzle | 1 (griffiths) |
| | Firebase / Mongo | 1 each |
| Payments | **Stripe** | 10 (others: Authorize.Net, PayFast, TakePayments) |
| Uploads | **Cloudinary** | 10 (others: Supabase Storage, S3/R2) |
| Email | Resend | 6 |
| | Nodemailer SMTP | 6 |
| | Mailgun / SES | 1 each |
| Validation | Zod | 12 |
| Forms | react-hook-form | 10 |
| Client state | Zustand / React Query | 9 / 8 |
| Styling | Tailwind (+ shadcn/Radix) | 16 |

**Conclusion:** the starter's default stack is **Next.js 16 + Supabase (Auth, Postgres, Storage) + Stripe + Cloudinary + Zod + RHF + Tailwind/shadcn**. Email must be behind an adapter because the team is split 50/50 between Resend and SMTP.

---

## 2. Modules that repeat in almost every project

These were rebuilt from scratch in most projects. They are the starter's core.

| Module | Rebuilt in | Best existing implementation to start from |
|---|---|---|
| Supabase client split (browser / server / admin) + `proxy.ts` session refresh | 11 | pullnbangrz `src/lib/supabase/` + `src/proxy.ts`; thrillpay `src/lib/supabase/{server,admin}.ts` |
| Auth flows (signup, verify, login, reset, OAuth callback) | 15 | StoryHorde `src/features/auth/actions.ts` + `src/app/auth/callback/route.ts` (has Google OAuth) |
| Session guards (`requireUser`, `requireRole`, account status recheck) | 12 | StoryHorde `src/lib/auth/session.ts`; Coremx `src/lib/auth/session.ts` (rechecks status + password version) |
| RBAC / permissions | 14 | gfv `src/lib/auth/rbac.ts` (clear grants); Jeremiah `src/lib/auth/permissions.ts` + RLS migration `0030_permission_rls.sql`; booking `lib/api-context.ts` (typed role/MFA/tenant wrappers) |
| `ActionResult` + error mapping | 8 (often copy-pasted per file) | StoryHorde `src/lib/action-result.ts` + `src/lib/errors.ts` (nested Zod field paths) |
| Env validation (public vs server split) | 7 | patrick `src/lib/env.ts`; pullnbangrz `src/lib/config/env.ts` + `env.server.ts` |
| Central routes / constants | 7 | patrick `src/lib/constants/routes.ts` (includes cache tags) |
| Email (provider + templates) | 14 | StoryHorde `src/features/emails/server/registry.tsx` (typed React Email registry, delivery log, retry job); Coremx `src/lib/email/index.ts` (swappable transport) |
| Uploads | 14 | StoryHorde `src/features/uploads/server/mutations.ts` (presign + quota); gfv `src/lib/storage/upload-rules.ts` (MIME sniffing, size, safe keys); pullnbangrz `src/lib/cloudinary/sign.ts` |
| Stripe checkout + webhooks | 10 | StoryHorde `src/features/billing/server/webhook.ts` (retryable event claims, idempotent sync, subscriptions) |
| Rate limiting | 10 (mostly broken, see §3) | Jeremiah `src/lib/auth/rate-limit.ts` + `0049_auth_rate_limits.sql` (atomic Postgres buckets, cross-instance) |
| Admin panel: users, roles, suspend | 12 | Jeremiah `src/app/admin/(panel)/users/` + `src/lib/admin/staff-actions.ts` (invite, roles, disable) |
| Admin tables, URL filters, server pagination | 10 | patrick `src/features/admin/schemas/filters.ts` + admin tables; Jeremiah `src/components/admin/pagination.tsx` |
| Audit log | 6 | booking `lib/audit-log.ts`; planivo `20260119_enable_audit_logging.sql` (trigger with changed-field detection) |
| In-app notifications (DB + bell + realtime) | 7 | Jeremiah `src/lib/account/notifications.ts`; planivo `NotificationBell.tsx` + realtime hook |
| SEO: metadata helper, sitemap, robots, JSON-LD, OG | 11 | Jeremiah `src/lib/seo/metadata.ts`; StoryHorde `src/lib/seo/metadata.ts` |
| Cron routes (secret-guarded) | 8 | Jeremiah `src/app/api/cron/`; StoryHorde `src/features/cron/server/run-job.ts` (locked jobs) |
| DB migrations + seed scripts | 15 | pullnbangrz `supabase/migrations/` + `scripts/db-verify.mjs` |
| Error boundaries (`error.tsx`, `global-error.tsx`) | 9 | Jeremiah `src/app/error.tsx` + `global-error.tsx` |

### Optional modules (needed in some projects, not all)

| Module | Seen in | Best source |
|---|---|---|
| MFA (TOTP) | booking, chickenandy, nimbly | booking auth pages + `proxy.ts` MFA gate |
| Session revocation / sign out all devices | patrick | patrick `src/lib/auth/revocation.ts` |
| i18n (typed dictionaries) | patrick, booking, stmevents | patrick `src/lib/i18n/dictionary.ts` |
| PDF generation (invoice, certificate) | Coremx, pullnbangrz, Uberlesson | Coremx `src/features/invoices/invoice-document.tsx` (React PDF) |
| Analytics dashboard (KPIs + charts) | 9 | Jeremiah `src/lib/admin/analytics.ts` + Recharts |
| Cookie consent + GTM | gfv, patrick | gfv `src/features/consent/` |
| SMS (Twilio) / WhatsApp | patrick, booking, gfv | patrick `src/lib/sms/client.ts` |
| Multi-tenant | booking, nimbly, griffiths, pullnbangrz | booking `lib/api-context.ts` |
| Stripe Connect (marketplace payouts) | Uberlesson, airtrainer, booking, thrillpay | thrillpay `src/lib/stripe-connect-actions.ts` |
| Realtime hook | airtrainer, pullnbangrz, planivo | pullnbangrz `src/lib/realtime/useCollectionChannel.ts` (reconnect healing) |
| Structured logger | nimbly | nimbly `src/lib/logger.ts` |

---

## 3. Mistakes that repeat across projects (the starter must make these impossible)

These are the strongest argument for a shared starter: the same bugs appear in project after project.

1. **Fail-open security.** Rate limiter allows requests when Redis/DB errors (booking, thrillpay, StoryHorde, Speedyprint, planivo). Middleware skips auth if Supabase config is missing (Speedyprint). Missing profile defaults to `business_admin` (pullnbangrz). Failed permission fetch grants full access (planivo). **Starter rule: every guard fails closed.**
2. **Stripe webhook idempotency missing or wrong.** No dedup at all (thrillpay, planivo, aryef, Speedyprint PayFast); event recorded before processing so a crash blocks the retry (booking); effects run without a durable claim (patrick). **Starter rule: one webhook helper with claim, process, mark-done, unique `event_id`.**
3. **Process-local rate limits** that do not work on Vercel (patrick, stmevents, StoryHorde fallback). **Starter: Postgres-backed atomic limiter by default.**
4. **"Success" when nothing happened.** Unconfigured email returns success (gfv, Coremx); simulated payments marked paid (Coremx); missing DB switches to ephemeral JSON store (gfv). **Starter: missing config throws at startup via env schema, never in production silently.**
5. **Client-side-only protection.** Tokens in `localStorage` (Uberlesson), client-side portal guards (Uberlesson, chickenandy, nimbly), browser-written identity cookies that allow impersonation (airtrainer), self-writable role fields (nimbly), RLS `USING (true)` (airtrainer). **Starter: server-only role checks + RLS templates + tests that prove a user cannot escalate.**
6. **Unsigned Cloudinary uploads** with a public preset (booking, thrillpay). **Starter: signed uploads only.**
7. **Admin lists load every row into the browser** (thrillpay, chickenandy, booking, airtrainer). **Starter: server pagination from day one.**
8. **No env validation** (Speedyprint, booking, thrillpay, stmevents, airtrainer, griffiths, nimbly).
9. **`ActionResult` and error mapping copy-pasted** in every action file (Jeremiah, gfv).
10. **Dev backdoors left in code:** quick-login super-admin (Jeremiah), hardcoded dev credentials (planivo, airtrainer e2e).
11. **No CI in any of the 17 projects.** Not one runs build + typecheck + tests on push. Several have Playwright but nothing runs it automatically.
12. **Email HTML duplicated inline** in each route with hardcoded recipients (stmevents, Uberlesson, airtrainer).

---

## 4. Recommended starter shape

```
dh-starter/
  src/
    app/                    # thin routes, error/loading/not-found per segment
    proxy.ts                # session refresh + optimistic gate
    lib/
      env.ts, env.server.ts # Zod, fail at boot
      constants/            # routes, messages, enums, cache tags
      supabase/             # browser / server / admin clients
      auth/                 # session guards, rbac, revocation
      errors.ts             # AppError classes
      action-result.ts      # ActionResult + Zod field errors + safeAction()
      rate-limit.ts         # Postgres atomic, fail closed
      audit.ts
      logger.ts
    features/
      auth/                 # core
      admin-users/          # core
      email/                # core: adapter (Resend | SMTP) + React Email registry
      uploads/              # core: Cloudinary signed | Supabase Storage
      notifications/        # core
      seo/                  # core
      billing/              # optional: Stripe checkout, subscriptions, webhooks
      mfa/                  # optional
      i18n/                 # optional
      pdf/                  # optional
      analytics/            # optional
  supabase/
    migrations/             # profiles, roles, permissions, audit_log, rate_limits,
                            # notifications, webhook_events, email_log + RLS
    schema.sql              # canonical schema
    seed.sql
  tests/                    # Vitest unit + Playwright e2e (auth, RBAC, webhook)
  .github/workflows/ci.yml  # lint, typecheck, test, build
  scripts/remove-module.ts
  docs/                     # one README per module
```

### Build order

1. **Phase 1 (core):** env, constants, errors, ActionResult, Supabase clients, proxy, auth flows (+ Google OAuth), session guards, RBAC + RLS, rate limiter, email adapter + branded templates, error boundaries, CI.
2. **Phase 2:** admin users panel (invite, roles, suspend), server-paginated data table, audit log, uploads (Cloudinary signed), notifications, SEO kit, cron helper.
3. **Phase 3 (optional modules):** Stripe billing (one-time + subscriptions + webhook helper), MFA, i18n, PDF, analytics dashboard, consent/GTM.
4. **Phase 4:** `remove-module` script, module docs, start one real project from it and feed fixes back.

---

## 5. Decision change from the first plan

The first plan suggested Better Auth + Drizzle for portability. The scan shows ~11 of 17 projects already use **Supabase for auth + DB**, and the team's migrations, RLS knowledge and schema-backup workflow are all Supabase based. **The starter should be Supabase-first.** Keep the data-access layer behind named functions so a Prisma/Drizzle variant stays possible later.
