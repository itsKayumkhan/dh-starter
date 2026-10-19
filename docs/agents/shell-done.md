# Shell delivery

## Files

- Added reusable `src/components/shared/{data-table,page-header,confirm-dialog,empty-state,stat-card,command-menu}.tsx` and kept `providers.tsx` intact.
- Added `src/components/layout/{dashboard-shell,navigation,demo-activity-chart}.tsx` and navigation tests.
- Added `src/lib/pagination.ts` and unit tests.
- Replaced the protected dashboard and admin layouts and overview pages. Added their loading and error states and `src/app/(dashboard)/admin/_data/overview.ts` for authorized user counts.
- Added `tests/e2e/shell.spec.ts` and `docs/agents/shell-checklist.md`.
- Added optional `HeaderItem?: ComponentType` to `AppModule` without editing `installedModules`.

## Use

- `DashboardShell` wraps all routes in `(dashboard)` and renders installed module navigation and header items when the registry is populated. Admin pages require staff or admin on the server.
- `DataTable` reads `page`, `pageSize`, `q`, `sort`, and filter keys from nuqs with server refreshes. Table consumers type columns as `DataTableColumn<RowDto>[]` from `@/components/shared/data-table`; see `shell-needs.md` for the TanStack v9 contract correction.
- `parseListParams` validates and normalizes list URL state. `pageCount` computes the server page count.
- No shell env keys or `module.json` manifest are needed because shell is core UI, not a removable module.

## Verification and TODO

- `npx.cmd tsc --noEmit -p .` passed.
- Focused ESLint passed.
- Vitest passed: 2 files, 6 tests.
- Browser E2E was written but not executed because the task forbids running `next dev`, including through Playwright's web server. It needs a migrated and seeded local database.
- Replace demo dashboard metrics and chart data before production. The exact lines are in `shell-checklist.md`.
