---
description: Turn a fresh copy of the starter into a client project (brand, modules, env, checklist)
argument-hint: "<project name> <domain>"
---

Set up this copy of dh-starter as a new project: $ARGUMENTS

1. Confirm this is a fresh copy, not the starter repo itself, and that it is disconnected from the starter: run `git remote -v`. If any remote points to `dh-starter`, run `git remote remove <name>` for it, then ask the user for the project's own repository URL and add it as `origin`. Stop if the working folder is the starter repo itself.
2. Ask the user which modules the project needs (`npm run module:list` shows them). For each module not needed, run `npm run module:remove -- <id>`, then one migration: `npm run db:migrate -- --name remove_unused_modules`.
3. Put the brand data (name, description, URL, logo, support email, address, social links) in `src/config/site.ts` as defaults so the CMS settings can edit them. The visual design comes entirely from the project's own design source (CLAUDE.md section 4): restyle or replace any starter UI as needed.
4. Seed logins: change `prisma/seed.mts` to `admin@<domain>`, `staff@<domain>`, `user@<domain>` with memorable brand-based passwords (for example `<Brand>@Admin2026`); update the table in `docs/ARCHITECTURE.md`.
5. `.env`: copy `.env.example`, give the project its own local database (change the port and database name in `DATABASE_URL`, e.g. `localhost:5434/<project_slug>`, so it never shares data with another project), fill local values; list which real keys the user must provide (email provider, Stripe, Cloudinary, Google OAuth) for the modules kept.
6. Rename `package.json` `name`, update `README.md` title and intro for the project. Keep the starter credit line (Kayum Khan, for Digital Heroes) in the README and `author` in `package.json`.
7. Review `docs/PRODUCTION_CHECKLIST.md`: remove lines for removed modules, keep the rest for go-live.
8. Record the starter origin: rewrite `STARTER_VERSION` as `<current version> (<starter commit sha>)` using the commit this copy was made from (`git log -1 --format=%h` before any project commit; a copy made with `gh repo create --template` has no starter history, so it records the version only). Keep `CHANGELOG.md` and `docs/STARTER_SYNC.md` so the project can pull later starter updates.
9. Keep the `cms` module if the project has an admin side (CLAUDE.md section 8); set the real brand defaults in `src/config/site.ts` and the page copy defaults in `src/config/content.ts`.
10. Run `/verify` and report. Do not push.
