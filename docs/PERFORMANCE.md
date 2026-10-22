# JavaScript bundle measurements

Measured on 2026-10-22 with Next.js 16.4.2 production builds served by `next start -p 3200`. Each figure is the sum of the gzipped transfer bytes for distinct `/_next/static/*.js` script URLs in the page HTML, divided by 1024. The signed-out `/login` page was fetched without a cookie. The protected pages were fetched with a seeded admin session. Every listed page returned HTTP 200 and every listed script returned HTTP 200.

| Page                  | Before (KiB) | After (KiB) | Change (KiB) | Requested limit |
| --------------------- | -----------: | ----------: | -----------: | --------------: |
| `/`                   |        238.7 |       190.0 |        -48.7 |            <150 |
| `/pricing`            |        241.9 |       203.5 |        -38.4 |            <150 |
| `/contact`            |        289.0 |       251.1 |        -37.9 |            <150 |
| `/login` (signed out) |        311.1 |       276.2 |        -34.9 | No stated limit |
| `/dashboard`          |        436.4 |       333.3 |       -103.1 |            <300 |
| `/admin/users`        |        383.3 |       379.0 |         -4.3 |            <300 |
| `/admin/media`        |        392.7 |       388.2 |         -4.5 |            <300 |
| `/dashboard/account`  |        364.3 |       359.5 |         -4.8 |            <300 |

The requested limits remain unmet. The three largest scripts shared by the public home page total about 145.4 KiB gzip before app-specific code. The contact form adds form and validation code. Protected pages load the dashboard shell, notification bell, and their own interactive module components. The assigned file boundaries do not include those form and module components. Follow-up file requests are in `docs/agents/fix-perf-needs.md`.

The root layout now loads only the theme provider and toaster. Query, nuqs, and tooltip providers mount inside the protected dashboard layout. A source search found no Query or nuqs hooks on marketing or auth pages. The dashboard chart uses `next/dynamic` with a skeleton, and the command dialog is requested only after its button or keyboard shortcut opens it. A dynamic chunk can still transfer after hydration; this table measures scripts in initial HTML, not the full browser session.

## Repeat the measurement

1. Run `npm.cmd run build`, then start `npm.cmd run start -- -p 3200` in another terminal. A production server needs a valid non-console email provider configuration. Do not use a live email endpoint just for this measurement.
2. POST the seeded admin credentials to `/api/auth/sign-in/email` with an `Origin` header matching `BETTER_AUTH_URL`. Keep the returned session cookie. Fetch `/login` without it and protected pages with it.
3. Parse each response HTML for distinct script `src` values starting with `/_next/static/` and ending in `.js`. For each URL, `curl.exe --compressed -sS -o NUL -w "%{size_download}" http://localhost:3200/<script-path>` returns transfer bytes. Sum each page's distinct script sizes and divide by 1024. Confirm HTTP status and gzip content encoding. Stop the server after measurement.

For a new module, keep server data access and static layout in Server Components. Add a Client Component only for its interactive part. Keep Query and URL state providers in the smallest layout that needs them. Load charts, editors, command dialogs, and similar large UI when the user reaches or opens them. Check both initial HTML scripts and browser network transfers before declaring a bundle reduction.
