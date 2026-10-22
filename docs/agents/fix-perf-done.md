# Fix-perf summary

## Changed files

- `src/components/shared/providers.tsx`: kept theme and toast at the root, moved Query, nuqs, and tooltip out.
- `src/components/shared/dashboard-providers.tsx` and `src/app/(dashboard)/layout.tsx`: mount Query, nuqs, and tooltip only in the protected dashboard tree.
- `src/components/layout/activity-chart-panel.tsx` and `src/app/(dashboard)/dashboard/page.tsx`: dynamically load the Recharts activity chart with a skeleton.
- `src/components/layout/dashboard-shell.tsx`, `src/components/layout/lazy-command-menu.tsx`, and `src/components/layout/command-menu-dialog.tsx`: load the command dialog after first open or keyboard shortcut.
- `docs/PERFORMANCE.md`: before and after measurements, method, and bundle guidance.

No new environment keys were added. The production measurement used temporary `EMAIL_PROVIDER=smtp` and `SMTP_HOST=localhost` settings because the current development `.env` uses the disallowed production console provider. No email was sent.

## Verification

- `npx.cmd tsc --noEmit -p .`: passed.
- `npx.cmd eslint` on assigned source paths: passed.
- `npx.cmd vitest run src/components/layout/navigation.test.ts`: passed, 2 tests.
- `npm.cmd run build`: passed. An in-progress change to `src/instrumentation.ts` from another task produced an Edge Runtime warning about `process.exit`; this task did not edit it.
- Production HTTP check: all eight measured pages and all their initial JavaScript scripts returned 200. Authenticated routes used the seeded admin session. The measurement server on port 3200 was stopped.

The targets remain unmet; see `docs/PERFORMANCE.md` and `docs/agents/fix-perf-needs.md`. No end-to-end browser test was run because this wave disallows Playwright for fix-perf.
