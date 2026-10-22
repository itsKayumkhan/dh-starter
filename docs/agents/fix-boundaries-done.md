# Fix boundaries summary

## Changes

- Moved the admin overview user-count query to `src/app/(dashboard)/admin/_data/overview.ts` and kept its `users:read` check. The page still requires staff or admin.
- Added manifest-based `check:boundaries` and madge-based `check:circular` scripts, with both checks in CI.
- Moved module, email provider, and upload storage types into leaf type files to remove type-only cycles. Module removal markers remain intact.
- Mocked the module registry in the navigation test and added the requested Playwright output paths to `.gitignore`.
- Added madge 8 as a dev dependency. No environment keys were added.

## Verification

- `npx tsc --noEmit -p .`: passed in the working tree.
- `npx eslint` on owned TypeScript paths: passed.
- `npx vitest run src/components/layout/navigation.test.ts`: 2 passed.
- `npm run check:circular`: passed with zero cycles. Madge skipped three CSS imports (`tailwindcss`, `tw-animate-css`, and `shadcn/tailwind.css`).
- `npm run check:boundaries`: reports three imports in the out-of-scope `src/lib/email/templates/email-render.test.tsx`. See `docs/agents/fix-boundaries-needs.md`.
- In a copy at `%TEMP%/dh-starter-fix-boundaries-proof`, all five `npx tsx scripts/module-remove.mts <id>` commands completed. Package uninstall was disabled in the copy only, because its `node_modules` is a junction to the working tree. The copy's first typecheck and boundary check both failed only on the same email test imports. After removing that test from the copy, both checks passed with zero modules.

## Remaining

Move the contact-specific email test into the contact module, or remove its contact imports, as documented in `docs/agents/fix-boundaries-needs.md`. This is needed for CI and for the unchanged all-modules-removed copy to pass. The temporary npm cache at `.npm-cache-fix-boundaries/` could not be deleted because the shell policy rejected recursive removal.
