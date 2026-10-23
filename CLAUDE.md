# dh-starter: rules for Claude Code (whole team)

Reusable Next.js full-stack starter. Every client or internal project starts as a copy of this repo.
Goal of every change: reuse what exists, keep modules removable, ship production-ready code.

Read before non-trivial work: `docs/ARCHITECTURE.md` (layout, module contract, security defaults), `docs/MODULES.md`, `docs/PERFORMANCE.md`.
Next.js 16 differs from older versions: check `node_modules/next/dist/docs/` before using a Next API you are unsure about.

## 1. Workflow (every task)

1. **Inspect**: read the files involved and search for an existing component, hook, helper, schema or constant before creating one.
2. **Plan**: name the files you will touch. If the task needs a new dependency, a new pattern, a schema change or a cross-module import, say so and ask first.
3. **Implement** the smallest change that solves the task. No unrelated refactors, no renames or moves without a reason.
4. **Validate** with the checks in section 9. Never claim a check passed unless you ran it.
5. **Report** (section 11).

## 2. Where code goes

| What                                                                                                         | Where                                                                                                            |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Routes, layouts (thin, no business logic)                                                                    | `src/app/**`                                                                                                     |
| Shared primitives (shadcn)                                                                                   | `src/components/ui/`                                                                                             |
| Shared app components (DataTable, PageHeader, EmptyState, ConfirmDialog, StatCard)                           | `src/components/shared/`                                                                                         |
| Core helpers: env, db, auth, errors, safe actions, rate limit, audit, logger, email, seo, format, pagination | `src/lib/**`                                                                                                     |
| Brand and project config                                                                                     | `src/config/site.ts` (one place for name, URL, colors, contact)                                                  |
| Installed module registry                                                                                    | `src/config/modules.ts` (the only core file that may import a module)                                            |
| Removable feature                                                                                            | `src/modules/<id>/` with `module.json`, `module.ts`, `env.ts`, `server/`, `components/`, `schemas/`, `README.md` |
| Module tables                                                                                                | `prisma/schema/<id>.prisma` (one file per module)                                                                |
| Project-specific feature that is not reusable                                                                | `src/features/<name>/`                                                                                           |

## 3. Module rules (the starter's whole point)

- **Core never imports a module.** Only `src/config/modules.ts` links them. `npm run check:boundaries` enforces this and runs in CI.
- A module imports core only. Importing another module is allowed only if it is listed in `dependsOn` in its `module.json`.
- Every path a module adds (pages, API routes, e2e test, prisma file) goes in its `module.json`, so `npm run module:remove <id>` deletes everything.
- A module's env keys are validated lazily in `src/modules/<id>/env.ts`; a project without the module never needs them. Add them to `.env.example` under `# --- <id> module ---`.
- Registry lines in `src/config/modules.ts` end with `// module:<id>`.
- No circular imports, including type-only ones (`npm run check:circular`). Put shared types in their own file.
- A new module is created with `/new-module`.

## 4. Components and UI

- Reuse before creating: shadcn primitives, then `src/components/shared/`, then the registries in `components.json` (shadcn, Kokonut, Magic UI, React Bits, Bklit). Hand-write only when nothing fits, then restyle to theme tokens.
- Never duplicate buttons, inputs, dialogs, tables or forms. Extend with props or `cva` variants.
- Components get typed props, no hardcoded project text, colors, URLs or data, and handle loading, error, empty and disabled states.
- Theme tokens only (`bg-primary`, `text-muted-foreground`); no raw hex in components. Icons from `lucide-react`, toasts via `sonner`.
- Forms: react-hook-form + `zodResolver` + shadcn `Field`; disable submit while pending; show field and form errors from the `ActionResult`.
- Dates and numbers through `src/lib/format.ts` only (deterministic, avoids hydration mismatches).
- Motion: an existing or designed animation always wins. Add motion only where none exists, subtle, respecting `prefers-reduced-motion`.
- Responsive from 360px, accessible labels and focus states.

## 5. Next.js rules

- Server Components by default. `'use client'` only on the smallest leaf that needs state, effects, events or browser APIs. Never pass functions across the server/client boundary.
- `cacheComponents` is on: anything reading the session, `headers()`, `cookies()`, `searchParams` or `params` goes in an inner async component wrapped in `<Suspense>` with a skeleton. Do not add `runtime` or `dynamic` route segment configs. See `docs/agents/polish-done.md`.
- Page guards: `requireUser`, `requireRole`, `requirePermission` (redirect or render the 403 page). Action and route-handler guards: `assertUser`, `assertPermission`. `src/proxy.ts` is only an optimistic redirect, never the real check.
- If you catch errors around guards or data calls, call `unstable_rethrow(error)` first so redirects and 403s still work.
- Mutations: Server Actions through `safeAction()` returning `ActionResult<T>`, then `revalidatePath` or `revalidateTag`. Route handlers only for webhooks, third-party callbacks and public APIs.
- Heavy client code (charts, editors, dialogs opened later) loads with `next/dynamic`. Dashboard-only providers stay in the dashboard layout, not the root layout.
- Never hardcode a route: use `ROUTES` (`src/lib/constants/routes.ts`) or the module's `routes.ts`. Repeated user-facing strings go in `src/lib/constants/messages.ts`.

## 6. TypeScript and validation

- Strict mode. No `any`, no `@ts-ignore`, no non-null `!` without a comment explaining why.
- Zod validates every boundary: forms, server actions, route handlers, params, env. Infer types from schemas; do not redefine them.
- Never read `process.env` outside `src/lib/env/*` and `src/modules/<id>/env.ts`.

## 7. Data, auth and security

- Pages never call `db` directly. Queries live in `server/` data-access functions and return DTOs (no password hashes, tokens or internal flags).
- Every guard fails **closed**: missing config, a failed DB call or an unknown role means deny.
- Roles and permissions only through `src/lib/auth/permissions.ts` (`can(user, "users:read")`). No scattered `role === "admin"` checks.
- Rate limit public and sensitive actions with the core limiter. Uploads are always signed and checked server-side. Webhooks verify the signature and claim the event id before processing.
- Secrets stay server-side; only `NEXT_PUBLIC_*` reaches the client. Never log secrets, tokens or personal data (use `@/lib/logger`, never `console.log`).
- Emails: branded React Email templates using `src/lib/email/templates/components/layout.tsx` and `site.ts`; send only through `sendEmail()`. Never plain text only.

## 8. Database

- Prisma 7, multi-file schema in `prisma/schema/`. The schema files plus `prisma/migrations/` are the canonical schema backup.
- Every DDL change = a migration (`npm run db:migrate -- --name <what>`) committed together with the schema file. Never edit the database by hand.
- Never run `prisma migrate reset` or drop data without asking the user first.
- Local DB: `npm run db:dev` (background, no Docker), `npm run db:stop`. Seed logins are in `docs/ARCHITECTURE.md`.

## 9. Checks before you say "done"

Run what applies and report the real result:

| Change                          | Run                                                  |
| ------------------------------- | ---------------------------------------------------- |
| Any code                        | `npm run typecheck`, `npm run lint`, `npm run test`  |
| Imports, new files, modules     | `npm run check:boundaries`, `npm run check:circular` |
| Routes, layouts, config, deps   | `npm run build`                                      |
| User flows (auth, forms, admin) | `npm run test:e2e` (needs `npm run db:dev`)          |

`/verify` runs all of them. Add tests for new reusable logic and components (Vitest + Testing Library next to the file; Playwright in `tests/e2e/`). A failing check is reported with its output, never hidden.

## 10. Dependencies and production

- Before adding a package: check whether existing code or an installed package already does it, then explain why it is needed and ask. Feature-only packages go in that module's `module.json` `packages`.
- Anything that must change before go-live (test keys, placeholder copy, demo data, seed logins, dev fallbacks) gets a line in `docs/PRODUCTION_CHECKLIST.md` in the same commit: `- [ ] **<file:line>** - <what to change> + <why>`.
- Seed or test logins use the project's own domain (`admin@<domain>`) with a memorable password built from the brand name, dev and staging only.
- Never use em dash or en dash characters (the long dashes) anywhere: code, comments, UI copy, docs. Use a comma, colon, parentheses or a plain hyphen.
- Commits: conventional messages (`feat(billing): ...`). Do not push unless the user asks.

## 11. Completion report

End every task with:

- What was implemented.
- Which existing components, helpers or modules were reused.
- Files created or modified.
- Checks run and their real results.
- Open issues, assumptions, and any `PRODUCTION_CHECKLIST.md` lines added.

If a request conflicts with this architecture, explain the conflict and the options before making a structural change.
