# Contact module delivery

## Files

- `prisma/schema/contact.prisma`: Inquiry records, delivery status and status/date index.
- `src/modules/contact/`: manifest, nav entry, route constants, validated env, schemas, signed form token, public form, email templates, server actions, data access, admin controls and unit tests.
- `src/app/(marketing)/contact/`: public contact page.
- `src/app/(dashboard)/admin/inquiries/`: paginated list, detail page, loading and error states.
- `tests/e2e/contact.spec.ts`: browser submission flow with an env guard.
- `docs/agents/contact-checklist.md`: production replacements for notification inbox and site contact details.
- `docs/agents/contact-needs.md`: shared registry and table contract notes.

## Use and environment

The `/contact` page renders `ContactFormWithToken`. Other server pages can render the same component to embed a contact form. Staff and admin users manage submissions in `/admin/inquiries`; the nav entry uses `inquiries:read`. Set optional `CONTACT_NOTIFY_EMAIL` for the business inbox. Without it, the module uses `site.supportEmail`. Core email provider keys and `EMAIL_FROM` are still required for delivery.

`module.json` declares the contact module, its owned paths, one Prisma schema, no new packages, `CONTACT_NOTIFY_EMAIL`, and no module dependencies. The lead needs to register `contactModule` in the shared module registry.

## Verification

- `npx.cmd prisma validate`: passed.
- `npx.cmd prisma generate`: passed.
- `npx.cmd vitest run src/modules/contact/server/form-token.test.ts src/modules/contact/schemas/inquiry.test.ts`: 5 tests passed.
- Contact path ESLint: passed.
- `npx.cmd tsc --noEmit -p .`: passed after contact aligned its columns to the shell's TanStack Table v9 type.
- Playwright was not run because starting `next dev` is prohibited for this wave.

## Follow-up

The lead should merge the checklist lines and registry entry. A real database migration, email delivery check and Playwright browser run remain for integration.
