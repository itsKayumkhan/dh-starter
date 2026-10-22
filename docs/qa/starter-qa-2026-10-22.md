# Starter QA run (2026-10-22)

Checklist: 12 practical tests for a reusable starter (modularity, reuse, portability, config, security, dependencies, performance, regression). Every result below was actually run.

| #   | Test                                                         | Area          | Result                   | Evidence                                                                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------ | ------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Public pages work without auth / DB                          | Architecture  | PASS                     | Fresh build, DATABASE_URL pointed at a dead port: `/`, `/contact`, `/pricing`, `/login`, `/signup`, `/forgot-password`, `/sitemap.xml`, `/robots.txt` all 200; `/dashboard`, `/admin` 307 to login. 0 server errors.                                                                |
| 2   | Circular dependencies                                        | Architecture  | PASS (runtime) / cleanup | madge with type imports skipped: no cycles. 9 type-only cycles: `lib/email/providers/*`, `modules/uploads/server/storage.ts` <-> `cloudinary.ts`, `config/modules.ts` <-> each `module.ts`.                                                                                         |
| 3   | Button, Input, Dialog reused on many pages                   | Components    | PASS                     | Files importing: button 46, input 16, field 12, card 10, page-header 12, data-table 5, dialog 4, confirm-dialog 4.                                                                                                                                                                  |
| 4   | Loading, error, empty, disabled states tested                | Components    | FAIL                     | 0 component tests (`*.test.tsx`). 17 test files cover logic only.                                                                                                                                                                                                                   |
| 5   | Fresh clone + clean install + production build               | Portability   | PASS                     | `git clone` -> `npm ci` -> copy `.env.example` -> `npm run build`: 33 routes.                                                                                                                                                                                                       |
| 6   | Missing env gives a clear error                              | Portability   | PARTIAL                  | Build fails (good) but prints a raw ZodError JSON dump instead of a readable list. With an invalid production env the server keeps running and returns 500 on every route instead of exiting.                                                                                       |
| 7   | App name, theme, URL from one config                         | Configuration | PASS                     | App name only in `src/config/site.ts`; no raw hex in components; URLs from env; `process.env` only in allowed files.                                                                                                                                                                |
| 8   | Unauthorized user cannot reach protected page/API            | Security      | PASS (data) / UX bug     | Anon: APIs 401, webhook 400 without signature. User role: no admin data in any `/admin/*` page, Better Auth admin APIs 403, cannot set own role. Staff: only permitted pages. **Bug:** a forbidden page shows "Something went wrong" (error boundary) instead of a proper 403 page. |
| 9   | TypeScript, ESLint, unit tests                               | Quality       | PASS                     | tsc clean, eslint clean, 53 unit tests.                                                                                                                                                                                                                                             |
| 10  | Common component change does not break pages; CI on every PR | Regression    | PASS / gap               | CI runs lint, typecheck, unit, build on push and pull_request. E2E, circular and module-boundary checks are not in CI.                                                                                                                                                              |
| 11  | Bundle inspection                                            | Performance   | NEEDS WORK               | Gzipped JS: `/` 238 KB, `/pricing` 241, `/contact` 289, `/dashboard` 436, `/admin/users` 383. Marketing pages load dashboard-only providers (TanStack Query, nuqs) from the root layout; dashboard loads recharts eagerly.                                                          |
| 12  | No undocumented global tools                                 | Dependencies  | PASS                     | Every script uses local packages (prisma, tsx, react-email). Fresh clone needed only Node + npm.                                                                                                                                                                                    |

## Extra test: all modules removed (marketing-only project)

Removed admin, uploads, billing, notifications, contact in a fresh clone: registry, env keys and packages cleaned correctly, lint and 33 unit tests pass, but **typecheck and build FAIL**: `src/app/(dashboard)/admin/page.tsx` (core) imports `@/modules/admin/server/overview`. Core must never import a module.

## Other findings

- `test-results/.last-run.json` is committed; `test-results/` and `playwright-report/` must be gitignored.
- `@react-email/components` is deprecated on npm; templates should move to the supported package.

## Fix plan

1. Module boundaries: move admin overview query back to core, add `check:boundaries` script (no file outside a module's own paths may import `@/modules/*`) and `check:circular`, both in CI. Move shared types out to break type-only cycles.
2. Auth UX: proper 403 page via `forbidden()`; readable env error; fail fast on invalid production env.
3. Performance: dashboard-only providers out of the root layout, lazy charts; target under 150 KB gzip JS for marketing pages.
4. Component tests: React Testing Library tests for shared components and their states.
5. Email: migrate off deprecated `@react-email/components`.
6. Re-run this checklist, including the all-modules-removed build.

## Re-run after fixes (same day)

Fixes by 5 parallel Codex agents (fix-boundaries, fix-auth-ux, fix-perf, fix-component-tests, fix-email) plus lead integration. Every result below was re-run.

| #     | Test                    | Before                                | After    | Evidence                                                                                                                                                                                                                                                                                       |
| ----- | ----------------------- | ------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2     | Circular dependencies   | 9 type-only cycles                    | PASS     | `npm run check:circular`: no cycles, type imports included. In CI.                                                                                                                                                                                                                             |
| 4     | Component state tests   | 0 tests                               | PASS     | 26 test files, 85 tests (DataTable, EmptyState, PageHeader, StatCard, ConfirmDialog, UI primitives, auth forms, contact form, 7 email templates).                                                                                                                                              |
| 6     | Clear missing-env error | Raw ZodError                          | PASS     | Fresh clone without .env: "Invalid environment variables: NEXT_PUBLIC_APP_URL is missing. Copy .env.example to .env and fill them in." Invalid production env: `next start` logs the reason and exits with code 1.                                                                             |
| 8     | Forbidden UX            | "Something went wrong"                | PASS     | Browser as user role on /admin, /admin/users, /admin/audit: branded "Access denied" 403 page, no admin data. Sign-in rate limit also confirmed ("Too many requests" after repeated logins).                                                                                                    |
| 10    | CI coverage             | No boundary/cycle checks              | PASS     | CI runs lint, typecheck, check:boundaries, check:circular, unit tests, build.                                                                                                                                                                                                                  |
| 11    | Bundle size             | 238 KB home                           | IMPROVED | Home 190, pricing 204, contact 251, dashboard 333 KB gzip (see docs/PERFORMANCE.md). Next.js framework alone is about 145 KB, so a 150 KB page budget is not realistic; new budget: marketing under 200 KB, dashboard under 400 KB. Further splitting listed in docs/agents/fix-perf-needs.md. |
| Extra | All 5 modules removed   | Build FAILED (core imported a module) | PASS     | Fresh clone, all modules removed: tsc, lint, check:boundaries (0 modules), check:circular, 61 unit tests and build all pass.                                                                                                                                                                   |

Also fixed during the re-run:

- Brand font was never applied (layout set `--font-geist-sans`, shadcn CSS reads `--font-sans`), pages rendered in a serif fallback. Fixed and guarded by a smoke e2e test.
- Email: migrated to `react-email`, deprecated `@react-email/components` removed, `react-email` moved to dependencies.
- `db:dev` now runs `prisma dev -n dh-starter --detach` (stays up from any shell); added `db:stop`.

Final state: tsc, eslint, check:boundaries, check:circular, 85 unit tests, build with 0 warnings, e2e 10 passed / 3 skipped (Stripe and Cloudinary keys not set).

Known local-only issue: the `prisma dev` (PGlite) server can drop connections under heavy parallel load; restart with `npm run db:stop` then `npm run db:dev`.
