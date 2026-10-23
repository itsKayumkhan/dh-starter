# Contact module

Public contact form with an inquiry inbox for staff and admin users.

## Setup

1. Add `contactModule` to `src/config/modules.ts` using the module registry markers.
2. Generate the Prisma client and apply the contact schema through the normal migration workflow.
3. Set `CONTACT_NOTIFY_EMAIL` to the business inbox. If omitted, the module uses the current CMS support email, falling back to `src/config/site.ts`.
4. Configure the core email provider and `EMAIL_FROM` for delivery.

`module.json` lists all removable module paths, `prisma/schema/contact.prisma`, no extra packages, one env key, and no module dependencies.

## Use

Render `ContactFormWithToken` from `@/modules/contact/components/contact-form-with-token` on any server page. It creates a signed token for the client `ContactForm`. The form records its current page path as the inquiry source.

The public page is `/contact`. Staff and admin users with `inquiries:read` can open `/admin/inquiries`, search, filter by status, review messages, change status, and retry a failed business notification. Status changes and successful retries write audit entries. Contact submission is limited to five attempts per IP every ten minutes. The form checks an empty honeypot and requires at least three seconds between token issuance and submission.

The action saves the inquiry before sending email. A failed business notification or auto reply sets `emailStatus` to `failed` and leaves the inquiry in the inbox. The retry control sends the business notification only. If the auto reply failed, use the sender email address to follow up manually.

Run the unit tests with `npx vitest run src/modules/contact`. The Playwright flow needs a running app, database and core email env keys. It skips when the required env keys are absent.
