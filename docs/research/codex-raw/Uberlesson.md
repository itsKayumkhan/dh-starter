## Project

**UberLesson (ACOFE L)**, driving lesson marketplace. npm workspaces monorepo: Next.js 14.2.35 App Router, React 18, Express 4 API, Supabase Postgres with Prisma 5, Supabase Auth, Tailwind CSS 3, and Zustand. See [root package.json](<D:/coding/1_Adigital heroes/custom/Uberlesson/package.json>), [frontend package.json](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/package.json>), and [backend package.json](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/package.json>).

## Reusable modules found

| Area | Finding and key paths |
|---|---|
| Auth | Yes: signup, login, email verification, reset, refresh and logout through Supabase Auth; no OAuth flow found. [auth routes](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/routes/auth/index.ts>), [service](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/services/auth-service.ts>) |
| Roles/RBAC/permissions | Yes: Prisma roles, server `requireRole`, frontend admin permission helpers. [auth middleware](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/middleware/auth.ts>), [permissions](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/lib/permissions/admin.ts>) |
| Route protection/middleware | API checks tokens, account status and roles; frontend portal layouts redirect client side. No Next middleware found. [auth middleware](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/middleware/auth.ts>), [admin layout](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/app/admin/layout.tsx>) |
| Admin panel/user management | Yes: users, approvals, settings, audit, payments and more. [admin routes](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/routes/admin/index.ts>), [users page](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/app/admin/users/page.tsx>) |
| API pattern | Express `/api/v1` routes and services, consumed through Axios; no Next server actions or route handlers found. [server](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/server.ts>), [client](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/lib/api.ts>) |
| Validation | Yes: Zod schemas mainly inside routes and forms, applied by reusable request middleware. [validate.ts](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/middleware/validate.ts>), [signup schema](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/app/(auth)/signup/schema.ts>) |
| Error handling | `AppError`, response envelope, centralized Express handler and Next error boundaries; no ActionResult. [response.ts](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/utils/response.ts>), [error handler](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/middleware/error-handler.ts>), [error.tsx](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/app/error.tsx>) |
| Env validation | Backend Zod startup validation; frontend checks selected variables at use time. [env.ts](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/config/env.ts>), [supabase.ts](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/lib/supabase.ts>) |
| Constants/routes config | Some constants and navigation config; no central route registry. [sub-nav.ts](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/lib/nav/sub-nav.ts>) |
| Email | Nodemailer SMTP; code templates plus editable DB Handlebars templates. [email service](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/services/email/index.ts>), [renderer](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/services/email/template-renderer.ts>) |
| Uploads/storage | Authenticated Cloudinary signature endpoint, then direct browser uploads. [upload route](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/routes/uploads/index.ts>), [client](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/lib/api/uploads.ts>) |
| Payments | Stripe Checkout, Connect, refunds and signed webhooks; no subscription billing found. [payment service](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/services/payment-service.ts>), [webhook](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/routes/payments/webhook.ts>) |
| Rate limiting | `express-rate-limit` on auth endpoints. [auth routes](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/routes/auth/index.ts>) |
| Logging | Morgan and console logs; database audit records for selected actions. [server](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/server.ts>), [audit service](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/services/audit-service.ts>) |
| Notifications | Database inbox, unread counts, email and SMS calls. [notification service](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/services/notification-service.ts>), [SMS service](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/services/sms-service.ts>) |
| PDF/certificates | PDFKit generates paid booking receipts; no certificate generator found. [learner bookings](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/routes/learner/bookings.ts>) |
| Search/pagination/tables | Filtered Prisma queries, offset pagination, reusable UI Pagination. [instructor search](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/routes/instructors/index.ts>), [Pagination](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/components/ui/Pagination.tsx>) |
| Dashboard/analytics | Admin KPI aggregates and instructor performance service. [admin routes](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/routes/admin/index.ts>), [performance service](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/services/performance-service.ts>) |
| i18n | No translation framework found; root layout fixes `lang="en"`. [layout](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/app/layout.tsx>) |
| SEO | Metadata, dynamic sitemap and robots. [blog page](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/app/(public)/blog/page.tsx>), [sitemap](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/app/sitemap.ts>), [robots](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/app/robots.ts>) |
| Testing | Jest backend tests and Playwright E2E suites. [backend tests](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/tests>), [e2e](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/e2e>), [config](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/playwright.config.ts>) |
| CI/CD | Deploy configs and a pre-commit hook; no CI workflow found. [vercel.json](<D:/coding/1_Adigital heroes/custom/Uberlesson/vercel.json>), [render.yaml](<D:/coding/1_Adigital heroes/custom/Uberlesson/render.yaml>), [pre-commit](<D:/coding/1_Adigital heroes/custom/Uberlesson/.husky/pre-commit>) |
| Migrations/seeds | Prisma migrations and several seed scripts. [migrations](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/prisma/migrations>), [seed.ts](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/prisma/seed.mts>) |
| Cron/background jobs | AWS Lambda job handlers plus an optional in-process scheduler. [jobs](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/jobs>), [scheduler](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/jobs/scheduler.ts>) |
| Realtime | No application realtime transport found; notifications use API reads. [notification routes](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/routes/notifications/index.ts>) |

## Best pieces to extract

1. [Zod env validation](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/config/env.ts>): clear startup failure for missing configuration.
2. [Validation middleware](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/middleware/validate.ts>) with [typed response/error utilities](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/utils/response.ts>): consistent API contract.
3. [Auth and role middleware](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/middleware/auth.ts>): checks live user status and email verification.
4. [Cloudinary signed upload flow](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/routes/uploads/index.ts>): limits folders and keeps signing server side.
5. [Stripe webhook entry](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/routes/payments/webhook.ts>) with [raw-body mounting](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/server.ts>): preserves signature verification.

## Anti-patterns to avoid

- Access and refresh tokens live in browser `localStorage`; use server-managed sessions in the starter. [api.ts](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/lib/api.ts>)
- Portal guards depend on client-side redirects; add server-side page protection. [admin layout](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/app/admin/layout.tsx>)
- Roles and validation rules are repeated across layers. [Prisma schema](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/prisma/schema.prisma>), [auth store](<D:/coding/1_Adigital heroes/custom/Uberlesson/frontend/lib/store/auth-store.ts>), [auth routes](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/routes/auth/index.ts>)
- Handlebars compiles editable HTML with `noEscape: true`; review escaping before reuse. [template renderer](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/services/email/template-renderer.ts>)
- The admin route file combines many domains, and notification delivery is fire-and-forget. Split modules and use a durable queue where delivery matters. [admin routes](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/routes/admin/index.ts>), [notification service](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/services/notification-service.ts>)

## Project-specific (not reusable)

Driving instructor onboarding, lesson scheduling and holds, learner wallets, Australian suburb/geocoding data, theory questions, and boost pricing: [Prisma schema](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/prisma/schema.prisma>), [lesson-hold service](<D:/coding/1_Adigital heroes/custom/Uberlesson/backend/src/services/lesson-hold-service.ts>).