# Production checklist

- [ ] **prisma/seed.mts:19** - Do not run development seed logins in production + predictable credentials would grant access.
- [ ] **.env.example:14** - Replace console email provider with Resend or SMTP + console delivery is disabled in production.
- [ ] **.env.example:4** - Set a new unique BETTER_AUTH_SECRET in production + shared development secrets can compromise sessions.
- [ ] **src/config/site.ts:6** - Replace placeholder description, logo, email, address and social links + outgoing pages and emails must carry the client brand.
- [ ] **.env.example:2** - Replace example local database credentials for each deployment + example values must never point at a production database.
- [ ] **.github/workflows/ci.yml:8** - Keep CI dummy credentials isolated from deployment secrets + build checks do not need live services.
- [ ] **prisma.config.ts:13** - Supply a real DATABASE_URL before migrating + the fallback URL is intentionally invalid.
- [ ] **src/lib/env/client.ts:8** - Set NEXT_PUBLIC_APP_URL to the public production origin + the development fallback points to localhost.
