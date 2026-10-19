<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# dh-starter rules for every agent (MANDATORY)

Read `docs/ARCHITECTURE.md` before writing code. It defines the folder layout, the module contract and the security defaults. Follow it exactly.

## Hard rules
- TypeScript strict. No `any`, no `@ts-ignore`, no non-null `!` without a comment.
- Server Components by default. `'use client'` only on leaf components that need state, effects, events or browser APIs.
- Validate every input with Zod (forms, server actions, route handlers, params, env).
- Never read `process.env` directly outside `src/lib/env/*` and `src/modules/<id>/env.ts`.
- Never hardcode a route string. Use `ROUTES` from `@/lib/constants/routes`. Modules may export their own route constants from their folder.
- User-facing strings that repeat go in `@/lib/constants/messages`.
- Server actions: use `safeAction()` from `@/lib/safe-action` and return `ActionResult<T>`. Never throw raw errors to the client.
- Auth is re-checked server-side (`requireUser`, `requireRole`, `requirePermission`) in every action, route handler and protected layout.
- All guards fail CLOSED.
- Pages never call `db` directly. Put queries in `server/` data-access functions and return DTOs (no password hashes, tokens or internal flags).
- After a mutation call `revalidatePath` / `revalidateTag`.
- Forms: react-hook-form + zodResolver + shadcn `Field` components; disable submit while pending; show field and form errors from the ActionResult.
- UI: use the shadcn components in `src/components/ui`. Icons from `lucide-react`. Toasts via `sonner`. Use theme tokens (`bg-primary`, `text-muted-foreground`), never raw hex in components.
- Emails: branded HTML via React Email, reading brand data from `@/config/site`. Tables layout, inline styles, max width 600px.
- File names kebab-case. Absolute imports `@/`.
- NEVER use em dash or en dash characters (U+2014, U+2013) anywhere: code, comments, copy, docs. Use a comma, colon, parentheses or a plain hyphen.
- No `console.log` in committed code; use `@/lib/logger`.
- Anything that must change before production (test keys, placeholder copy, seed logins, dev fallbacks) gets a line in `docs/PRODUCTION_CHECKLIST.md`: `- [ ] **<file:line>** - <what to change> + <why>`.

## Parallel work rules
- Several agents work in this repo at the same time. Only create or edit files inside the paths your task assigns to you.
- Do NOT edit `package.json` or `package-lock.json` and do NOT run `npm install`. All packages are already installed. If something is truly missing, write it in `docs/agents/<your-task>-needs.md` and work around it.
- Do NOT run `next build`, `next dev` or `prisma migrate`. Verify with `npx tsc --noEmit -p .` and `npx eslint <your paths>`; only fix errors in files you own (other agents may be mid-work).
- Do NOT run git commands that change state (no commit, no checkout, no stash, no reset).
- When finished, write a short summary to `docs/agents/<your-task>-done.md`: files created, how to use, env keys, anything left TODO.
