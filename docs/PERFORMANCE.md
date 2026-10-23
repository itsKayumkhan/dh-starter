# JavaScript bundle budget

Budget (gzipped JS in the initial HTML of a page, CLAUDE.md section 5):

| Page group                |       Budget |
| ------------------------- | -----------: |
| Marketing and auth pages  | under 200 KB |
| Dashboard and admin pages | under 400 KB |

Next.js and React framework scripts alone are about 145 KB of every page.

## Current starter numbers

Measured on 2026-10-22, Next.js 16.4.2 production build, all modules installed.

| Page                  |    KB |
| --------------------- | ----: |
| `/`                   | 190.0 |
| `/pricing`            | 203.5 |
| `/contact`            | 251.1 |
| `/login` (signed out) | 276.2 |
| `/dashboard`          | 333.3 |
| `/admin/users`        | 379.0 |
| `/admin/media`        | 388.2 |
| `/dashboard/account`  | 359.5 |

`/pricing`, `/contact` and `/login` are over the marketing and auth budget.

## How to measure

1. `npm run build`, then `npm run start -- -p 3200` (a production server needs a non-console email provider in `.env`).
2. POST a seed login to `/api/auth/sign-in/email` with an `Origin` header matching `BETTER_AUTH_URL` and keep the session cookie. Fetch auth pages without it and protected pages with it.
3. For each page, collect the distinct script `src` values that start with `/_next/static/` and end in `.js`, fetch each with `curl --compressed -s -o /dev/null -w "%{size_download}"`, sum the bytes and divide by 1024.
4. Stop the server and record the numbers in the table above.
