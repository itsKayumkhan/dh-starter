## Project

**ThrillPay** — a vendor and customer platform for payments, deals, loyalty, and messaging. Single Next.js App Router app (declares Next.js ^16.2.4, React 19.2.3); Supabase Postgres with SQL migrations and no ORM; Supabase Auth; Tailwind CSS 4; React Query plus React contexts. No monorepo. See `package.json`, `src/app/layout.tsx`, and `supabase/migrations/`.

## Reusable modules found

- **Auth:** Exists. Supabase email signup and confirmation, password login, Google OAuth, reset email, password update, and cookie sessions. `src/components/auth/{SignupForm,LoginForm}.tsx`, `src/app/(auth)/forgot-password/page.tsx`, `src/app/auth/callback/route.ts`, `src/lib/supabase/`.
- **Roles, permissions, protection:** Exists. Profile roles and vendor team permissions; middleware redirects by role, server actions check membership, and SQL RLS protects data. `src/lib/{roles,getVendorForUser}.ts`, `src/middleware.ts`, `src/components/auth/RoleGate.tsx`, `supabase/migrations/20260402_security_fixes.sql`.
- **Admin/user management:** Exists. User listing, status changes, Auth bans, and deletion. `src/app/dashboard/admin/users/page.tsx`, `src/app/actions/{admin-users,account}.ts`.
- **API, validation, errors:** Server actions, Next.js route handlers, and direct Supabase queries; no Express. Zod schemas sit in forms and individual handlers. Error boundaries and mixed `{ error }` returns/throws exist; no shared error class or ActionResult. `src/app/actions/`, `src/app/api/chat/messages/route.ts`, `src/components/auth/SignupForm.tsx`, `src/app/error.tsx`.
- **Env, routes:** No central environment validation; modules read `process.env` directly. Navigation arrays exist in `src/lib/navigation.ts`; route checks are also embedded in `src/middleware.ts`.
- **Email, uploads:** Mailgun sends React Email templates with delivery logging and short-window deduplication. Cloudinary uses a client-side unsigned image upload. `src/lib/email/{client,send}.ts`, `src/lib/email/templates/`, `src/lib/cloudinary.ts`, `src/components/ui/FileUpload.tsx`.
- **Payments:** Stripe subscription checkout, plan changes, Connect, webhook handling, and billing records. `src/lib/{stripe,stripe-actions,stripe-connect-actions}.ts`, `src/app/api/stripe/webhook/route.ts`.
- **Rate limiting, logging, notifications:** A Postgres RPC backs rate limits; logging uses `console` plus email/billing tables. Broadcast UI, web push, and Sonner toasts exist. `src/lib/rate-limit.ts`, `supabase/migrations/20260416_rate_limit.sql`, `src/lib/push-server.ts`, `src/components/notifications/NotificationBell.tsx`.
- **PDF, search, dashboards:** QR page offers browser printing and image download; receipts link to Stripe invoice PDFs. No app-side PDF or certificate generator found. SQL vendor search, client-side table filters, and admin/vendor analytics exist. `src/app/dashboard/vendor/qr/page.tsx`, `src/lib/email/templates/receipt.tsx`, `supabase/migrations/20260521_search_vendors_smart.sql`, `src/app/dashboard/admin/page.tsx`.
- **i18n, SEO, tests, delivery:** No i18n or unit/e2e tests found. Metadata, Open Graph images, sitemap, and robots exist. Netlify build config exists; no CI workflow found. `src/app/{layout,sitemap,robots}.tsx`, `src/app/opengraph-image.tsx`, `netlify.toml`.
- **Database, jobs, realtime:** SQL migrations and demo seeds; authenticated cron handlers plus Supabase `pg_cron`. Chat tables are in the Supabase realtime publication, but no client channel subscription was found. `supabase/migrations/`, `scripts/seed-demo.ts`, `src/app/api/cron/`, `supabase/migrations/20260318_create_chat.sql`.

## Best pieces to extract

1. **Supabase browser/server/admin client split** — clear session and privilege boundaries: `src/lib/supabase.ts`, `src/lib/supabase/{server,admin}.ts`.
2. **Team authorization pattern** — typed permissions, server checks, and database policy examples: `src/lib/{roles,getVendorForUser}.ts`, `supabase/migrations/20260402_security_fixes.sql`.
3. **Email delivery layer** — reusable rendering, provider wrapper, logs, and deduplication: `src/lib/email/{client,send}.ts`.
4. **Subscription checkout flow** — customer reuse and in-place plan changes: `src/lib/stripe-actions.ts`.
5. **Database-backed rate limiter** — shared counter across server instances: `src/lib/rate-limit.ts`, `supabase/migrations/20260416_rate_limit.sql`.

## Anti-patterns to avoid

- Webhook writes lack a clear event-level idempotency guard; `stripe_event_id` is not unique in the billing schema. `src/app/api/stripe/webhook/route.ts`, `supabase/migrations/20260327_vendor_subscriptions.sql`.
- Rate limiting fails open on RPC errors. `src/lib/rate-limit.ts`.
- Environment assertions and service-role client creation are repeated. `src/lib/supabase/admin.ts`, `src/app/api/stripe/webhook/route.ts`, `src/lib/push-server.ts`.
- Admin users are loaded wholesale and filtered in the browser. `src/app/dashboard/admin/users/page.tsx`.
- Reset emails return to the dashboard; no dedicated reset-password screen was found. `src/app/(auth)/forgot-password/page.tsx`.

## Project-specific (not reusable)

Vendor/customer marketplace flows, QR payment routing, loyalty points, referrals, premium ads, chatbot, ranking, and ThrillPay branding: `src/app/dashboard/`, `src/lib/vendorRanking.ts`, `src/lib/plans.ts`, `public/`.