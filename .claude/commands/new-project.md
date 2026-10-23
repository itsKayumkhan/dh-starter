---
description: Turn a fresh copy of the starter into a client project (brand, modules, env, checklist)
argument-hint: "<project name> <domain>"
---

Set up this copy of dh-starter as a new project: $ARGUMENTS

1. Confirm this is a fresh copy (not the starter repo itself): check `git remote -v` and ask the user if unsure.
2. Ask the user which modules the project needs (`npm run module:list` shows them). For each module not needed, run `npm run module:remove -- <id>`, then one migration: `npm run db:migrate -- --name remove_unused_modules`.
3. Update brand data in one place, `src/config/site.ts`: name, description, URL, logo, brand colors, support email, address, social links. Update theme tokens in `src/app/globals.css` if the design has its own colors. Do not hardcode the brand anywhere else.
4. Seed logins: change `prisma/seed.mts` to `admin@<domain>`, `staff@<domain>`, `user@<domain>` with memorable brand-based passwords (for example `<Brand>@Admin2026`); update the table in `docs/ARCHITECTURE.md`.
5. `.env`: copy `.env.example`, fill local values; list which real keys the user must provide (email provider, Stripe, Cloudinary, Google OAuth) for the modules kept.
6. Rename `package.json` `name`, update `README.md` title and intro for the project.
7. Review `docs/PRODUCTION_CHECKLIST.md`: remove lines for removed modules, keep the rest for go-live.
8. Record the starter origin: rewrite `STARTER_VERSION` as `<current version> (<starter commit sha>)` using the commit this copy was made from (`git log -1 --format=%h` before any project commit). Keep `CHANGELOG.md` and `docs/STARTER_SYNC.md` so the project can pull later starter updates.
9. Keep the `cms` module if the project has an admin side (CLAUDE.md section 8); set the real brand defaults in `src/config/site.ts` and the page copy defaults in `src/config/content.ts`.
10. Run `/verify` and report. Do not push.
