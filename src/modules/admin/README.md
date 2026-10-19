# Admin users and audit

The `admin` module provides `/admin/users`, `/admin/users/[id]`, and `/admin/audit`.

## Setup

No module-specific environment keys, packages, or Prisma tables are required. The core Better Auth admin plugin, email provider, user/session/account tables, and audit table must be configured. The dashboard shell must register `adminModule` in `src/config/modules.ts` with a module marker. The shared admin layout must admit staff and admin; each page and action applies its own permission check.

Admins can invite, change roles, ban, unban, revoke sessions, and delete users. Staff can view users and user details when the shared layout allows it. Audit review requires `audit:read` and is admin only. User mutations use core `safeAction`, Better Auth where appropriate, `writeAudit`, and path revalidation. Role changes use a database transaction and a PostgreSQL advisory lock to protect the last active admin. Ban and delete use the same lock while calling the Better Auth admin API.

Invites create a Better Auth user with a random unusable password and a verified email, then create a Better Auth reset verification token for one hour. The branded core invite template sends the Better Auth reset callback URL. The reset page must consume its `token` query parameter through Better Auth's reset password client flow. If delivery fails, the action removes the newly created user.

## Environment and tests

No new env keys. The Playwright spec only runs its signed-in flow against a local URL with `DATABASE_URL` set and the development admin seed loaded. It uses the documented seed account. The unit tests cover role safety, ban expiry and invite validation.

## Removal

`module.json` lists every module-owned path and has no Prisma files or package dependencies. Removing this module does not remove core auth, email or audit tables.
