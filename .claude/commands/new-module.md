---
description: Scaffold a new removable module that follows the dh-starter module contract
argument-hint: "<module-id> <one line purpose>"
---

Create a new module for: $ARGUMENTS

1. Read `CLAUDE.md` section 3, `docs/ARCHITECTURE.md` (Module contract) and one existing module as the reference shape (`src/modules/contact` is the smallest complete one).
2. Confirm the plan with the user before writing: module id (kebab-case), tables, pages (dashboard / admin / marketing), API routes, env keys, packages, permissions needed, `dependsOn`.
3. Create:
   - `src/modules/<id>/module.json` listing every path the module adds (pages, API routes, `tests/e2e/<id>.spec.ts`), `prismaFiles`, `packages`, `envKeys`, `dependsOn`.
   - `src/modules/<id>/module.ts` exporting `<id>Module: AppModule` (type from `@/config/module-types`) with nav items and permissions.
   - `src/modules/<id>/routes.ts`, `env.ts` (lazy Zod), `server/` (queries returning DTOs, actions via `safeAction`), `components/`, `schemas/`, `README.md` (setup, env keys, how to remove).
   - `prisma/schema/<id>.prisma` if it needs tables (no back-relations into `auth.prisma`; user ids as plain indexed strings), then a migration.
   - Env keys in `.env.example` under `# --- <id> module ---` with a comment line above each key.
   - Unit tests next to the logic, component tests for its forms, and `tests/e2e/<id>.spec.ts`.
   - Route paths named after `<id>` under `src/app/api/`, `src/app/(dashboard)/dashboard/`, `src/app/(dashboard)/admin/`, or `src/app/(marketing)/`.
4. Register it in `src/config/modules.ts`: import line and array entry, both ending with `// module:<id>`.
   If it owns user data, export `onUserDelete(userId: string): Promise<void>` from `src/modules/<id>/lifecycle.ts` and register its import and array entry in `src/config/module-lifecycle.ts`, each ending with `// module:<id>`.
5. If the module needs a new permission, add it to `src/lib/auth/permissions.ts` and say so.
6. Prove it is removable: in a temp copy of the repo run `npx tsx scripts/module-remove.mts <id> --dry-run`, then run `/verify`.
7. Add production-only items to `docs/PRODUCTION_CHECKLIST.md` under `## Module: <id>`. Finish with the CLAUDE.md completion report.
