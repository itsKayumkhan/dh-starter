# dh-starter: rules for Claude Code (whole team)

Reusable Next.js full-stack starter. Every client or internal project starts as a copy of this repo.
Goal of every change: reuse what exists, keep modules removable, ship production-ready code.

Purpose: a tested, working base (auth, roles, email, uploads, payments, CMS, admin, security, tests) so the team does not rebuild and retest the same code in every project, and Claude spends its time on the project's own work. It is not a component library and not a design system. Keep starter code lean: no abstractions or extra config layers that exist only to avoid editing starter files.

The starter is only a base. Inside a project, any starter file (core, shared components, modules, scripts, config) may be edited, extended or replaced to fit that project. The rules below keep the code correct and secure; they never forbid changing starter code.

Read before non-trivial work: `docs/ARCHITECTURE.md` (layout, module contract, security defaults), `docs/MODULES.md`, `docs/PERFORMANCE.md`.
Next.js 16 differs from older versions: check `node_modules/next/dist/docs/` before using a Next API you are unsure about.

## 1. Workflow (every task)

1. **Inspect**: read the files involved and search for an existing component, hook, helper, schema or constant before creating one.
2. **Plan**: name the files you will touch. If the task needs a new dependency, a new pattern, a schema change or a cross-module import, say so and ask first.
3. **Implement** the smallest change that solves the task. No unrelated refactors, no renames or moves without a reason.
4. **Validate** with the checks in section 10. Never claim a check passed unless you ran it.
5. **Report** (section 12).

**Client projects:** if `docs/project/` exists, read `project-context.md` and `pending-items.md` before starting; they are the client's confirmed requirements and decisions. Client chat (the base chat file at the project root, or pasted Fiverr / WhatsApp messages, or "client ne bola ...") always goes through the `client-context` skill (`/client-context`), never an informal summary. Client-facing replies, emails and messages are written with the `msg` skill (`/msg`). A repo hook reminds Claude of both automatically.

## 2. Where code goes

| What                                                                                                         | Where                                                                                                            |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Routes, layouts (thin, no business logic)                                                                    | `src/app/**`                                                                                                     |
| Shared primitives (shadcn)                                                                                   | `src/components/ui/`                                                                                             |
| Shared app components (DataTable, PageHeader, EmptyState, ConfirmDialog, StatCard)                           | `src/components/shared/`                                                                                         |
| Core helpers: env, db, auth, errors, safe actions, rate limit, audit, logger, email, seo, format, pagination | `src/lib/**`                                                                                                     |
| Brand and project defaults                                                                                   | `src/config/site.ts` (defaults only; read them through `getSiteSettings()`)                                      |
| Editable content block registry                                                                              | `src/config/content.ts` (key, Zod schema, default, editor fields)                                                |
| Installed module registry                                                                                    | `src/config/modules.ts` and `src/config/module-lifecycle.ts` (the only core files that may import a module)      |
| Removable feature                                                                                            | `src/modules/<id>/` with `module.json`, `module.ts`, `env.ts`, `server/`, `components/`, `schemas/`, `README.md` |
| Module tables                                                                                                | `prisma/schema/<id>.prisma` (one file per module)                                                                |
| Project-specific feature that is not reusable                                                                | `src/features/<name>/`                                                                                           |

## 3. Module rules (the starter's whole point)

- **Core never imports a module.** Only `src/config/modules.ts` (nav, header items, public routes) and `src/config/module-lifecycle.ts` (user deletion cleanup) link them. `npm run check:boundaries` enforces this and runs in CI.
- A module imports core only. Importing another module is allowed only if it is listed in `dependsOn` in its `module.json`.
- Every path a module adds (pages, API routes, e2e test, prisma file) goes in its `module.json`, so `npm run module:remove <id>` deletes everything.
- A module's env keys are validated lazily in `src/modules/<id>/env.ts`; a project without the module never needs them. Add them to `.env.example` under `# --- <id> module ---`.
- Registry lines in `src/config/modules.ts` and `src/config/module-lifecycle.ts` end with `// module:<id>`.
- A module that stores user data exports `onUserDelete(userId)` from `src/modules/<id>/lifecycle.ts` and registers it in `src/config/module-lifecycle.ts`. Users are deleted only through Better Auth (self-service) or the admin delete action; both run these hooks before anything is deleted, and a failing hook blocks the deletion.
- No circular imports, including type-only ones (`npm run check:circular`). Put shared types in their own file.
- **A module is done only when it is tested.** Every logic file (`server/`, `schemas/`, `lifecycle.ts`, helpers, form components) has a unit test in the module that imports it, and the module has `tests/e2e/<id>.spec.ts`. `npm run check:module-tests` enforces this and runs in CI. A file with only types or one-line wiring starts with `// test-exempt: <reason>`. The same applies to every change to a module: new or changed behaviour gets new or updated tests in the same commit.
- Unit tests cover, where it applies: the happy path (result, DB write, revalidate, audit entry); validation failures (missing, malformed, too long input returns field errors and writes nothing); anonymous and missing-permission callers denied; a denied rate limit; ownership (no access to another user's records); edge cases (empty, not found, already in that state, duplicates and idempotency, pagination bounds); and failures (a DB or provider error becomes a generic `ActionResult` error, nothing half-done stays). Form component tests cover rendering, server field and form errors, the pending state and the success state.
- A new module is created with `/new-module`.

## 4. UI and UX: owned by each project, not by the starter

This repo gives **no visual style direction**. Every project has its own unique style, and any style rule from the starter would lower its quality. The only team-wide UI rules are the layout and motion rules at the end of this section.

- The starter's current look (shadcn neutral theme, Geist font, sample marketing pages, dashboard layout) is a **throwaway placeholder**. It is not a reference, not a style guide and not a default to stay close to.
- Fonts, colors, spacing, radius, layout, page structure, component and UI libraries, icons, imagery, motion and UX patterns are decided only by the project's own design source (Figma, the client's brand, a reference site, the designer, or a design skill). Follow that source fully. Never push back on a design because it differs from the starter, never keep starter visuals "for consistency", and never ask whether to keep the starter's look.
- The project may restyle, replace or delete any starter UI, including the marketing pages, the dashboard shell and the admin screens, as long as the logic underneath (guards, actions, data access) keeps working.
- **Starter code stays design-neutral** so it never fights a project's design: core and modules contain no fixed fonts, colors, radius or brand imagery, visual values come from the theme in `src/app/globals.css` and the fonts set in the root layout, and no starter test asserts a specific font, color or layout.

Technical rules that are not about design (they apply in every project):

- Reuse starter logic before writing new logic: `safeAction`, guards, `DataTable` and `parseListParams` for server pagination, `sendEmail`, content and settings helpers.
- Forms validate on the server through `safeAction` and show the field and form errors from the `ActionResult` (how they look is the project's choice).
- Dates and numbers go through `src/lib/format.ts` (deterministic, prevents hydration mismatches).
- No hardcoded project text, URLs or data inside reusable components: pass them as props or read them from settings and content.

Layout rules (every project, unless the client's approved design explicitly shows otherwise):

- **No eyebrow labels** above headings: no "(01) Who we are", no small uppercase kicker, no dot + label pill. The heading carries the context itself.
- **Text beside a heading only when it is needed.** By default there is no text on the right side of a heading; never add sub-text there just to fill space. Needed supporting text goes directly under the heading. It goes on the right only when putting it under the heading would break the layout, or when it comes together with a button or CTA (text and button sit together on the right). Buttons, CTAs, links and visuals beside a heading stay on the right; never stack them under it. Heroes keep their designed layout; only remove an eyebrow label there.
- **Step or count numbers ("01, 02") rarely**: only when the order is the real content, in one place only, never on both sides at once.

Motion rules (every project with a UI):

- **The design's own animation always wins.** Motion defined by the design, the reference, the spec or existing code is used exactly as-is: never replaced, re-timed or layered over.
- Add motion only to fill gaps: components built from scratch with no motion spec, or elements left static with no guidance. Use the `transitions-dev` skill there when it is installed, otherwise a short, subtle standard transition.
- One element, one owner per animated property: never stack a new transition on a property an existing animation already controls.
- Everything added respects `prefers-reduced-motion`.
- No project-wide motion polish or tokenization pass unless the user asks for it (`transitions-polish`).

## 5. Next.js rules

- Server Components by default. `'use client'` only on the smallest leaf that needs state, effects, events or browser APIs. Never pass functions across the server/client boundary.
- `cacheComponents` is on: keep the static page structure outside `<Suspense>`, and read the session, `headers()`, `cookies()`, `searchParams`, `params` and uncached queries in an inner async component wrapped in `<Suspense>` with a fallback. Pass `params` / `searchParams` promises down without awaiting them in the page component. Do not add `runtime` or `dynamic` route segment configs.
- Page guards: `requireUser`, `requireRole`, `requirePermission` (redirect or render the 403 page). Action and route-handler guards: `assertUser`, `assertPermission`. `src/proxy.ts` is only an optimistic redirect, never the real check.
- If you catch errors around guards or data calls, call `unstable_rethrow(error)` first so redirects and 403s still work.
- Mutations: Server Actions through `safeAction()` returning `ActionResult<T>`, then `revalidatePath` or `revalidateTag`. Route handlers only for webhooks, third-party callbacks and public APIs.
- Heavy client code (charts, editors, dialogs opened later) loads with `next/dynamic`. Dashboard-only providers stay in the dashboard layout, not the root layout.
- Never hardcode a route: use `ROUTES` (`src/lib/constants/routes.ts`) or the module's `routes.ts`. Repeated user-facing strings go in `src/lib/constants/messages.ts`.
- **Public pages**: every public page sets metadata with `buildMetadata()` and is listed in `src/app/sitemap.ts` (unless it is intentionally `noIndex`).
- **Bundle budget** (gzipped JS per page, method in `docs/PERFORMANCE.md`): marketing and auth pages under 200 KB, dashboard and admin pages under 400 KB. Check it before adding a client-side package or a large client component, and record new numbers in `docs/PERFORMANCE.md`.

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
- **Emails are always branded HTML, never plain text** (plain text only as the alternative part of a multipart message). Every email (contact and lead notifications, auto-replies, order and booking confirmations, password and verification mails, invoices, admin alerts) uses a React Email template on `src/lib/email/templates/components/layout.tsx`, takes its colors, fonts, logo and button style from the project's site settings, and is sent only through `sendEmail()`. Each has a brand header, a clear title, the data in a readable table or card, a primary action button and a footer with the business name, address and a one-line note. HTML rules: tables for layout, inline CSS only, no external CSS or JS, max width about 600px, web-safe font fallbacks, alt text on images, readable when images are blocked.

## 8. Admin, CMS and content

- **Every project with an admin side keeps the `cms` module.** Anything the client may want to change (text, images, links, contact details, social, SEO defaults) comes from the CMS, never hardcoded in a component.
- **Settings**: read brand, contact, social and SEO defaults with `getSiteSettings()` (DB value over `src/config/site.ts` default). Do not import `site.ts` directly in UI, metadata or emails.
- **Content**: page copy comes from `getContent("<page>.<section>")`. Every new marketing section adds a block to `src/config/content.ts` with a Zod schema, a sensible default (the current design copy) and editor fields, so the page renders with an empty database and the client can edit it in admin.
- Content reads are cached and the CMS save action revalidates the matching cache tag; do not query content tables directly from pages.
- **Every new admin page**: permission check (`requirePermission`), server-side pagination for lists (`parseListParams` + `DataTable`), an audit log entry for every mutation (`writeAudit`).

## 9. Database

- Prisma 7, multi-file schema in `prisma/schema/`. The schema files plus `prisma/migrations/` are the canonical schema backup.
- Every DDL change = a migration (`npm run db:migrate -- --name <what>`) committed together with the schema file. Never edit the database by hand.
- Never run `prisma migrate reset` or drop data without asking the user first.
- Local DB: `npm run db:dev` in its own terminal (real Postgres 17, no Docker, data in `.data/`, Ctrl+C to stop). Seed logins are in `docs/ARCHITECTURE.md`.

## 10. Checks before you say "done"

Run what applies and report the real result:

| Change                          | Run                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| Any code                        | `npm run typecheck`, `npm run lint`, `npm run test`                                |
| Imports, new files, modules     | `npm run check:boundaries`, `npm run check:circular`, `npm run check:module-tests` |
| Routes, layouts, config, deps   | `npm run build`                                                                    |
| User flows (auth, forms, admin) | `npm run test:e2e` (needs `npm run db:dev`)                                        |

`/verify` runs all of them. Add tests for new reusable logic and components (Vitest + Testing Library next to the file; Playwright in `tests/e2e/`). A failing check is reported with its output, never hidden.

## 11. Dependencies, production and starter sync

- Before adding a package: check whether existing code or an installed package already does it, then explain why it is needed and ask. Feature-only packages go in that module's `module.json` `packages`.
- Anything that must change before go-live (test keys, placeholder copy, demo data, seed logins, dev fallbacks) gets a line in `docs/PRODUCTION_CHECKLIST.md` in the same commit: `- [ ] **<file:line>** - <what to change> + <why>`.
- Seed or test logins use the project's own domain (`admin@<domain>`) with a memorable password built from the brand name, dev and staging only.
- **No suggestions in the repo.** Docs, READMEs, comments and command files state what exists and the mandatory rules only: no recommendations, alternatives or other tools to consider, follow-up ideas or "nice to have" lists. Give advice in the chat; the session working on a project decides the rest.
- **No long dashes.** Never use em dash or en dash characters (U+2014, U+2013) anywhere: code, comments, UI copy, emails, docs, chat replies. Use a comma, period, colon, parentheses or a plain hyphen. Plain hyphens in compound words and codes are fine.

Git rules:

- **Never work directly on `main`.** `main` is the default branch (never `master`). Start every task on a branch created from `main` (`feat/<name>`, `fix/<name>`, `chore/<name>`); the user merges.
- Commit each finished logical chunk without asking, with a conventional message (`feat(billing): ...`).
- **Never run `git push`.** The user pushes when ready.
- **No AI attribution**: no `Co-Authored-By: Claude` (or any Claude or Anthropic trailer) and no "Generated with Claude Code" lines in commits or pull request descriptions.
- Never override the git author (`git -c user.name=... -c user.email=...`); the terminal's git config is used.
- **Starter sync**: every project records the starter version it was created from in `STARTER_VERSION`. When you fix a bug or improve anything generic (core, shared components, a module) inside a client project, flag it in your report as "port to starter" and follow `docs/STARTER_SYNC.md`, so the next project gets the fix. Project-specific code never goes back to the starter.

## 12. Completion report

End every task with:

- What was implemented.
- Which existing components, helpers or modules were reused.
- Files created or modified.
- Checks run and their real results.
- Open issues, assumptions, and any `PRODUCTION_CHECKLIST.md` lines added.

If a request conflicts with this architecture, explain the conflict and the options before making a structural change.
