# Notifications delivery

## Files

- `prisma/schema/notifications.prisma`: notification rows and user indexes.
- `src/modules/notifications/`: module manifest, navigation and header export, Zod schemas, server delivery and queries, protected actions, bell, list and send form, and unit tests.
- `src/app/api/notifications/summary/route.ts`: authenticated no-store bell data.
- `src/app/(dashboard)/dashboard/notifications/`: user list, filters, pagination, loading and error states.
- `src/app/(dashboard)/admin/notifications/`: permission-guarded send form and loading state.
- `tests/e2e/notifications.spec.ts`: seeded-account send, read, and delete flow.

## Use

Register `notificationsModule` in the shared registry as described in `notifications-needs.md`, generate and migrate Prisma, then call `notify` from server code or use the admin send page. The bell polls the summary endpoint every 60 seconds and on window focus. Notifications are scoped to the signed-in user for reads and mutations. Admin sends require `notifications:send` and write an audit row.

## Env and manifest

No module-specific env keys or packages. `module.json` lists the module, route paths, Prisma schema, and e2e spec, with no module dependencies. The core database, auth, and email provider env settings still apply.

## Verification and TODOs

Prisma validation and generation passed. Focused ESLint and notification Vitest passed. TypeScript reported no errors in notifications-owned files; the shared tree still has concurrent errors in shell and other agent paths. Playwright was not executed because this wave prohibits starting `next dev`, and migrations were not run. A production broadcast to a large audience should move to a background job so a single server action does not time out. Email failures are counted and logged, while in-app rows remain available.
