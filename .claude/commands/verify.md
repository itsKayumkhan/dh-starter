---
description: Run every starter check (types, lint, boundaries, cycles, unit tests, build, optional e2e) and report real results
argument-hint: "[e2e]"
---

Run these in order from the repo root and keep going after a failure so the report is complete:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run check:boundaries`
4. `npm run check:circular`
5. `npm run test`
6. `npm run build`
7. Only if the argument is `e2e` ($ARGUMENTS): make sure the local DB is up (`npm run db:dev`), then `npm run test:e2e`.

Report a table: check, PASS or FAIL, and for every failure the first relevant error lines (file:line). Do not fix anything unless the user asks. Never mark a check PASS that you did not run. Env-gated e2e skips (Stripe, Cloudinary keys missing) are reported as SKIPPED with the reason.
