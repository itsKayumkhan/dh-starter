## Project

**STM Events** — an events, DJs, equipment rental, and gallery site with customer accounts and an admin CMS. Single Next.js 16.2 App Router project with React 19, Supabase/Postgres (no ORM), Supabase Auth, Tailwind CSS 4, and React context/local state. No monorepo structure. ([package.json](<D:/coding/1_Adigital heroes/custom/stmevents/package.json>))

## Reusable modules found

- **Auth:** Email signup/login/logout, Supabase sessions, callback code exchange, and password reset exist; no OAuth or custom verification flow. `app/api/auth/*`, `app/auth/callback/route.ts`, `app/account/login/page.tsx`, `app/account/reset-password/page.tsx`.
- **Roles/RBAC/permissions:** One admin identified by `ADMIN_EMAIL`; no role model or user management. `app/admin/layout.tsx`, `app/api/auth/me/route.ts`.
- **Route protection/middleware:** `proxy.ts` refreshes sessions; admin layout checks server side; account pages use a client auth gate. `proxy.ts`, `app/admin/layout.tsx`, `app/account/AccountAuthGate.tsx`.
- **Admin panel:** Dashboard, inquiry review, CRUD forms, and visual content editor; no user management. `app/admin/page.tsx`, `app/admin/inquiries/page.tsx`, `app/admin/visual-editor/`.
- **API pattern:** App Router route handlers and direct Supabase calls from client forms; no server actions or Express. `app/api/`, `app/admin/events/EventForm.tsx`.
- **Validation:** Required-field checks only; no Zod schemas. `app/api/auth/signup/route.ts`, `app/api/contact/route.ts`.
- **Error handling:** Ad hoc `try/catch` and JSON errors; no shared error class, `ActionResult`, or `error.tsx`. `app/api/contact/route.ts`.
- **Env validation and constants/routes config:** No validation or central route config; environment access and paths are inline. `lib/supabase/server.ts`, `app/admin/AdminShell.tsx`.
- **Email:** Resend with inline HTML inquiry templates. `app/api/contact/route.ts`, `app/api/book-event/route.ts`, `app/api/rental-inquiry/route.ts`.
- **Uploads/storage:** Cloudinary signed browser uploads, plus a server upload route. `app/admin/_components/ImageUpload.tsx`, `app/api/upload/sign/route.ts`, `app/api/upload/route.ts`.
- **Payments:** No checkout, webhooks, or subscriptions; events can link to Eventbrite. `app/admin/events/EventForm.tsx`.
- **Rate limiting:** In-memory, per-IP login attempt counter only. `app/api/auth/login/route.ts`.
- **Logging:** `console.error` only; no logging module. `app/api/upload/route.ts`.
- **Notifications:** Supabase table read/mark-read UI; no sender or realtime subscription found. `app/account/notifications/page.tsx`.
- **PDF/certificates:** None found.
- **Search/pagination/tables:** Inquiry type filtering and limited public queries; no reusable search, pagination, or table system. `app/admin/inquiries/page.tsx`, `lib/events.ts`.
- **Dashboard/analytics:** Supabase record counts; displayed trend figures are static. `app/admin/page.tsx`.
- **i18n:** Typed English/German dictionary and client locale context, plus editable overrides. `lib/i18n/translations.ts`, `lib/i18n/LanguageContext.tsx`, `lib/hooks/useSiteContent.tsx`.
- **SEO:** Static metadata and dynamic detail metadata; no sitemap or robots file found. `app/layout.tsx`, `app/events/[slug]/page.tsx`.
- **Testing, CI/CD, migrations/seed scripts, cron/background jobs, realtime:** No implementation found in the project tree or scripts in `package.json`. `test.md` and `QA_REPORT.md` are documents, not automated tests.

## Best pieces to extract

1. **Supabase SSR client setup** — clean server/browser split and cookie refresh pattern: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `proxy.ts`.
2. **Direct Cloudinary uploader** — drag/drop, preview, and signed browser upload: `app/admin/_components/ImageUpload.tsx`, `app/api/upload/sign/route.ts`.
3. **Editable bilingual content pattern** — configured fields, fallbacks, and preview: `app/admin/visual-editor/sections/index.ts`, `lib/hooks/useSiteContent.tsx`.
4. **Admin form controls** — reusable date, select, field, and rich-text components: `app/admin/_components/`.
5. **Typed locale context** — compact dictionary lookup and locale switching: `lib/i18n/LanguageContext.tsx`, `lib/i18n/translations.ts`.

## Anti-patterns to avoid

- Admin authorization is duplicated as one email comparison; upload routes check only for a logged-in user. `app/admin/layout.tsx`, `app/api/upload/sign/route.ts`.
- Login rate limiting is process-local; it will not coordinate across instances. `app/api/auth/login/route.ts`.
- Inquiry routes duplicate HTML and hardcode recipient addresses; database and email result errors can be ignored. `app/api/contact/route.ts`, `app/api/book-event/route.ts`, `app/api/rental-inquiry/route.ts`.
- Client forms write directly to Supabase and often omit error handling; the starter would need explicit RLS policies and server-side validation. `app/admin/events/EventForm.tsx`, `app/admin/_components/DeleteButton.tsx`.
- Preview messages accept any origin; rich HTML is rendered without a visible sanitization step. `lib/hooks/useSiteContent.tsx`, `app/events/[slug]/EventDetailClient.tsx`.

## Project-specific (not reusable)

Eventbrite ticket fields, DJ and equipment schemas, nightlife copy/assets, inquiry types, and the STM-specific visual-editor section list: `lib/events.ts`, `lib/djs.ts`, `lib/equipment.ts`, `app/admin/visual-editor/sections/index.ts`.