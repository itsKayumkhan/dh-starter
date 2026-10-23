<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# dh-starter rules for every agent (MANDATORY)

**Read and follow `CLAUDE.md` in full.** It is the single source of truth for the team (Claude Code reads it automatically; Codex and other agents must read it before writing code). Then read `docs/ARCHITECTURE.md`.

## Parallel agent waves (only when your task prompt says you are part of one)

- Several agents work in this repo at the same time. Only create or edit files inside the paths your task assigns to you.
- Do NOT edit `package.json` or `package-lock.json` and do NOT run `npm install`. If something is missing, write it in `docs/agents/<your-task>-needs.md`.
- Do NOT run `next build`, `next dev` or `prisma migrate` unless your task allows it. Verify with `npx tsc --noEmit -p .` and `npx eslint <your paths>`; only fix errors in files you own.
- Do NOT run git commands that change state (no commit, checkout, stash, reset).
- When finished, write `docs/agents/<your-task>-done.md` (gitignored, for the lead only): files created, how to use, env keys, open issues.
