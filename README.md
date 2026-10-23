# DH Starter

A reusable Next.js 16 full stack starter for Digital Heroes projects. Core provides PostgreSQL through Prisma 7, Better Auth, email transport, role permissions, audit logs, rate limiting, and an app shell. Project features belong in removable modules.

## Quick start

1. Run `npm install` and copy `.env.example` to `.env`.
2. Run `npm run db:dev`. It starts a local Postgres in the background (no Docker) at the `DATABASE_URL` already in `.env.example`. After a reboot run it again; stop it with `npm run db:stop`.
3. Run `npm run db:migrate`, then `npm run db:seed`.
4. Run `npm run dev` and open `http://localhost:3000`.

Docker alternative: run `docker compose up -d postgres` and set `DATABASE_URL=postgres://postgres:postgres@localhost:5432/dhstarter` before migrating. Set a unique `BETTER_AUTH_SECRET` and a real email provider before production.

Development seed logins:

| Role  | Email                | Password            |
| ----- | -------------------- | ------------------- |
| admin | admin@dhstarter.test | DhStarter@Admin2026 |
| staff | staff@dhstarter.test | DhStarter@Staff2026 |
| user  | user@dhstarter.test  | DhStarter@User2026  |

The seed is idempotent and uses Better Auth to create password accounts. It then marks seed users verified and assigns roles. Do not run it against production.

## Scripts

| Script                                                                               | Purpose                      |
| ------------------------------------------------------------------------------------ | ---------------------------- |
| `dev`, `build`, `start`                                                              | Next.js lifecycle            |
| `lint`, `typecheck`, `format`                                                        | Source checks and formatting |
| `test`, `test:e2e`                                                                   | Unit and browser tests       |
| `db:dev`, `db:stop`, `db:migrate`, `db:generate`, `db:seed`, `db:studio`, `db:reset` | Prisma workflow              |
| `module:list`, `module:remove`                                                       | Inspect and remove modules   |
| `email:dev`                                                                          | React Email template preview |

## Starting a client project

Copy this repository for the client. Update `src/config/site.ts`, public brand assets, `.env`, and `docs/PRODUCTION_CHECKLIST.md`. Run `npm run module:list` and remove unused modules with `npm run module:remove -- <id> --dry-run` followed by the same command without `--dry-run`. See `docs/MODULES.md` for the manifest contract. Run a Prisma migration after removing database-backed modules.

Core APIs and security rules are in `docs/ARCHITECTURE.md`. Protected actions and route handlers check auth on the server. Proxy checks only cookie presence for navigation.

## Working with Claude Code (team rules)

- `CLAUDE.md` is the team rulebook. Claude Code loads it automatically in every session; Codex and other agents read it through `AGENTS.md`.
- `.claude/settings.json` pre-approves the safe checks (typecheck, lint, tests, build, boundary and cycle checks) and blocks destructive commands (`prisma migrate reset`, force push, reading `.env`). Personal overrides go in `.claude/settings.local.json` (gitignored).
- Slash commands:
  - `/verify` (or `/verify e2e`): runs every check and reports real results.
  - `/new-module <id> <purpose>`: scaffolds a removable module that follows the module contract.
  - `/new-project <name> <domain>`: turns a fresh copy of the starter into a client project (brand, modules, seed logins, env, checklist).
