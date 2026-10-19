## Project

**PeakPeps** (`Coremxtraining`) — research-chemical ecommerce storefront. Single-repo Next.js App Router **15.5.19** with PostgreSQL/Prisma **6**, NextAuth **4** credentials auth, Tailwind **3**, and Zustand **5**. React Query is installed but has no usage found. Sources: `package.json`, `prisma/schema.prisma`, `src/features/cart/store.ts`.

## Reusable modules found

| Area | Implementation and key paths |
|---|---|
| Auth | Signup, login, email verification and password reset; bcrypt, hashed single-use tokens, JWT sessions. No OAuth. `src/features/account/actions/auth-actions.ts`, `src/lib/auth/options.ts`, `src/lib/db/queries/password-reset.ts` |
| Roles/RBAC/permissions | `CUSTOMER`/`ADMIN` roles with admin helpers; no granular permissions. `prisma/schema.prisma`, `src/lib/auth/session.ts` |
| Route protection | JWT middleware plus server-side layout/action checks. `src/middleware.ts`, `src/app/admin/layout.tsx` |
| Admin/user management | Dashboard, customer listing, suspension and exports. `src/app/admin/`, `src/features/admin/actions/customer-actions.ts` |
| API pattern | Primarily Server Actions; route handlers for auth, exports, PDFs and webhooks. No Express. `src/features/admin/actions/`, `src/app/api/` |
| Validation | Feature-local Zod schemas and `safeParse`. `src/features/account/schemas/`, `src/features/admin/schemas/` |
| Error handling | `ActionResult`, JSON response helpers and page error boundary; no shared error classes found. `src/types/index.ts`, `src/lib/api/index.ts`, `src/app/error.tsx` |
| Env validation | Zod parsing with defaults. `src/lib/env.ts` |
| Constants/routes | Central route, message and enum maps. `src/lib/constants/` |
| Email | SMTP, Brevo or console transport; templates for auth, orders and enquiries. `src/lib/email/index.ts`, `src/lib/email/templates/` |
| Uploads/storage | Admin-signed direct Cloudinary image uploads. `src/features/admin/actions/upload-actions.ts`, `src/features/admin/image-uploader.tsx` |
| Payments | Stripe card/ACH PaymentIntents, refunds and signed webhooks; simulated crypto. No subscriptions found. `src/lib/payments/`, `src/app/api/webhooks/stripe/route.ts` |
| Rate limiting | None found on auth or public actions. `src/features/account/actions/auth-actions.ts` |
| Logging | Console calls; no monitoring integration found. `src/app/error.tsx` |
| Notifications | Email and client toast store; no persistent in-app notifications found. `src/lib/email/`, `src/lib/stores/toast-store.ts` |
| PDF/certificates | React PDF invoices and certificates. `src/features/invoices/invoice-document.tsx`, `src/lib/pdf/coa-pdf.tsx` |
| Search/pagination/tables | Prisma text filters, offset pagination and generic admin table. `src/lib/db/queries/products.ts`, `src/features/admin/data-table.tsx` |
| Dashboard/analytics | Live revenue, order and stock aggregates; no analytics service found. `src/app/admin/page.tsx`, `src/lib/db/queries/orders.ts` |
| i18n | None found; English UI and locale formatting. `src/app/layout.tsx` |
| SEO | Metadata, structured data, sitemap, robots and OG images. `src/app/layout.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/components/seo/` |
| Testing | E2E script declared, but no test files or Playwright config found. `package.json` |
| CI/CD | Vercel config and PR template; no CI workflow found. `vercel.json`, `.github/` |
| DB migrations/seeds | Prisma migration history and seed script. `prisma/migrations/`, `prisma/seed.ts` |
| Cron/background jobs | None found; some email work is launched asynchronously. `src/app/api/auth/verify-email/route.ts` |
| Realtime | None found. `package.json` |

## Best pieces to extract

1. [Auth session helpers](<D:/coding/1_Adigital heroes/custom/Coremxtraining/src/lib/auth/session.ts>) — recheck account status and password version against the database.
2. [Webhook transaction](<D:/coding/1_Adigital heroes/custom/Coremxtraining/src/lib/db/queries/webhook-events.ts>) — records events and updates orders atomically.
3. [Email provider interface](<D:/coding/1_Adigital heroes/custom/Coremxtraining/src/lib/email/index.ts>) — swaps transports behind one send function.
4. [Signed upload action](<D:/coding/1_Adigital heroes/custom/Coremxtraining/src/features/admin/actions/upload-actions.ts>) — keeps upload credentials server-side.
5. [Product query layer](<D:/coding/1_Adigital heroes/custom/Coremxtraining/src/lib/db/queries/products.ts>) — maps Prisma rows to client-safe DTOs.

## Anti-patterns to avoid

`src/lib/env.ts` permits placeholder auth/database defaults. `src/lib/payments/stripe/payment-intents.ts` and `providers/crypto.ts` report simulated payments as successful when unconfigured. `src/features/account/actions/auth-actions.ts` logs a reset link on email failure; `src/lib/email/index.ts` can select console delivery without a production guard. Export routes use JWT-only admin checks, bypassing the account recheck in `src/lib/auth/session.ts`.

## Project-specific (not reusable)

Research-use compliance and age gate (`src/features/compliance/`), batch COAs (`src/features/coa/`), product content and branding (`src/features/home/content.ts`, `public/brand/`).