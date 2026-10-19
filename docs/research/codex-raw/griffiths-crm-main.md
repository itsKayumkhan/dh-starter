## Project

**Griffiths CRM**, multi-tenant CRM for inquiries, quotes, jobs, documents, and payments. It is a Bun monorepo, **not a Next.js app**: React 19/Vite 7 frontend, Hono 4 API, PostgreSQL/Drizzle ORM, Better Auth, Tailwind CSS 4 with Radix/shadcn components, and TanStack Query 5 plus React Context for state. See `package.json`, `apps/web/package.json`, `apps/api/package.json`.

## Reusable modules found

- **Auth, yes:** Better Auth handles password login, configured signup and email verification, reset, Google/Microsoft OAuth, and sessions. The UI provides login and reset; users are primarily invited by admins. `apps/api/src/lib/auth.ts`, `apps/web/src/lib/auth.ts`, `apps/web/src/pages/login.tsx`.
- **Roles/RBAC, yes:** `app_admin`, `manager`, and `tenant_user` checks; no granular permission system. **Route protection, yes:** Hono auth/role/tenant middleware and client route guards. `apps/api/src/middleware/auth.ts`, `apps/web/src/components/protected-route.tsx`.
- **Admin/user management, yes:** tenant and user CRUD with emailed password-setting invites. `apps/api/src/routes/admin.ts`, `apps/web/src/pages/admin/users-tab.tsx`.
- **API pattern, yes:** Hono route handlers, neither Next.js server actions nor Express. **Validation, yes:** Zod schemas mostly beside handlers, applied with `zValidator`. `apps/api/src/index.ts`, `apps/api/src/routes/admin.ts`.
- **Error handling, partial:** per-handler `try/catch`, JSON errors, and console logging; no shared error classes, `ActionResult`, or `error.tsx`. `apps/api/src/routes/uploads.ts`.
- **Env validation, no central schema:** direct `process.env` reads and a few required-value checks. `.env.example`, `apps/api/src/lib/auth.ts`. **Constants/routes config, partial:** status constants in `packages/shared/src/db/schema.ts`, navigation in `apps/web/src/lib/nav-items.ts`, routes in `apps/web/src/App.tsx`.
- **Email, yes:** AWS SES or development SMTP/Mailpit; auth email HTML/text is inline. `apps/api/src/lib/email.ts`, `apps/api/src/lib/auth.ts`. **Uploads/storage, yes:** tenant-keyed S3 presigned uploads, signed reads, public/private buckets. `apps/api/src/lib/s3.ts`, `apps/api/src/routes/uploads.ts`.
- **Payments, yes:** TakePayments hosted payment flow, signed links, server-result webhook and callback; no subscriptions. `apps/api/src/routes/public-payments.ts`, `apps/api/src/lib/payment-token.ts`.
- **Rate limiting, none found. Logging, basic:** Hono request logger and `console`. **Notifications, partial:** Sonner toasts and inbound Gmail Pub/Sub webhook; no general app notification system. `apps/api/src/index.ts`, `apps/web/src/App.tsx`, `apps/api/src/routes/inbox-webhook.ts`.
- **PDF/certificates, partial:** printable worksheet via `window.print()`; no PDF or certificate generator. `apps/web/src/pages/customer/memorial-worksheet-print.tsx`.
- **Search/pagination/tables, yes:** validated query filters and database limit/offset in document and inbox lists. `apps/api/src/routes/documents.ts`, `apps/api/src/routes/inbox.ts`. **Dashboard/analytics, yes:** tenant-scoped CRM aggregates. `apps/api/src/routes/dashboard.ts`.
- **i18n, no:** English UI with some `en-GB` formatting. **SEO, minimal:** static title only; no sitemap or robots implementation found. `apps/web/index.html`.
- **Testing, no automated unit/e2e suite found. CI/CD, partial:** Docker/Terraform deployment assets, no CI workflow found. `apps/api/Dockerfile`, `terraform/`. **DB migrations/seeds, yes:** Drizzle SQL migrations and seed/bootstrap scripts. `packages/shared/drizzle/`, `apps/api/scripts/seed.ts`.
- **Cron/background jobs, yes:** in-process ten-minute Gmail sync scheduler. `apps/api/src/lib/email-sync-scheduler.ts`. **Realtime, no client WebSocket/SSE found;** Gmail push reaches a webhook.

## Best pieces to extract

1. Better Auth configuration and invite/reset flow, a substantial auth starting point: `apps/api/src/lib/auth.ts`, `apps/api/src/routes/admin.ts`.
2. Auth, role, and tenant middleware, small, clear server-side guards: `apps/api/src/middleware/auth.ts`.
3. S3 signing and public/private storage helpers, reusable upload foundation: `apps/api/src/lib/s3.ts`.
4. SES/SMTP email adapter, useful production/development split: `apps/api/src/lib/email.ts`.
5. Validated, tenant-scoped paginated listing pattern, useful for agency dashboards: `apps/api/src/routes/documents.ts`.

## Anti-patterns to avoid

- `/sign-url` accepts a caller-provided URL without checking ownership of the underlying object; add tenant/key authorization before copying it. `apps/api/src/routes/uploads.ts`, `apps/api/src/lib/s3.ts`.
- OAuth state signing falls back to a fixed secret if configuration is missing. `apps/api/src/routes/email-integrations.ts`.
- Client hooks repeat API URLs, fetch handling, and response parsing. `apps/web/src/hooks/use-customers.ts`, `apps/web/src/hooks/use-documents.ts`.
- Customer search loads all tenant customers and runs per-customer queries; use database filtering and pagination. `apps/api/src/routes/customers.ts`.
- The email scheduler starts in the API process, which can duplicate work across instances. `apps/api/src/index.ts`, `apps/api/src/lib/email-sync-scheduler.ts`.

## Project-specific (not reusable)

Memorial products and worksheets, lettering/material pricing, funeral-director records, Griffiths quote workflows, and TakePayments-specific gateway code: `apps/web/src/pages/customer/memorial-worksheet-print.tsx`, `apps/api/src/routes/quotes.ts`, `apps/api/src/routes/public-payments.ts`.