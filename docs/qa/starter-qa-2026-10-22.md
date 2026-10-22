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
