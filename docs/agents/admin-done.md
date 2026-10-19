# Admin module delivery

## Files and use

- `src/modules/admin/`: manifest, nav registration export, route constants, invite and user management actions, user and audit queries, forms, tables, environment check for local browser tests, and pure logic tests.
- `src/app/(dashboard)/admin/users/`: paginated user list, detail page, loading and error states.
- `src/app/(dashboard)/admin/audit/`: paginated audit review with action, actor and date filters, metadata Sheet, loading and error states.
- `tests/e2e/admin.spec.ts`: seeded local admin browser flow, skipped when local database setup is absent.

Admins can invite users, change roles, ban and unban, revoke sessions, delete users, and inspect audit entries. Staff can read users and details through the updated shared layout. Every mutation uses `safeAction`, permission checks, audit writes and revalidation. Role changes and admin removal guards use a PostgreSQL advisory lock. Invite links use Better Auth's reset verification token and callback route with the core invite email template.

## Manifest and environment

`module.json` lists the admin module and two owned route trees. It has no Prisma files, packages, new env keys, or module dependencies. The module uses core database, Better Auth and email environment values. The E2E spec checks for a local `DATABASE_URL` and uses the documented development seed account.

## Verification and TODOs

- ESLint passed on admin owned source and E2E spec.
- Vitest passed: 3 admin pure logic tests.
- Full TypeScript check currently reports errors in billing and contact table files, outside admin ownership. No diagnostics remained in admin owned paths after adapting to the shared v9 `DataTableColumn` type.
- Playwright was not executed because this wave prohibits starting `next dev`; run it after local DB migrations and seed.
- The lead or shell owner needs to register `adminModule` in `src/config/modules.ts`. Other integration notes are in `docs/agents/admin-needs.md`.
