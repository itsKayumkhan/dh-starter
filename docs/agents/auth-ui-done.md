# Auth UI delivery

## Files

- `src/app/(auth)/`: shared branded layout and sign in, sign up, verification, recovery, and reset pages.
- `src/components/auth/`: Better Auth forms, redirect sanitizer, sign out button, local route constants, and unit tests. The old shared login and signup forms were removed.
- `src/app/(dashboard)/dashboard/account/page.tsx` and `src/features/account/`: guarded account page with profile, security, sessions, and deletion UI, plus validated server actions and account schema tests.
- `tests/e2e/auth.spec.ts`: public auth form coverage and a skipped authenticated flow that requires a seeded database and captured email.

## Use and configuration

Open `/login` or `/signup`. Password recovery starts at `/forgot-password`. Signed in users can open `/dashboard/account`. `SignOutButton` can be used inside a dropdown item with `asChild`.

No new env keys. The existing Google ID and secret pair controls whether the Google button appears. Existing Better Auth, database, and email env keys are needed for live auth flows. This is core UI, so it has no `module.json`.

## Verification and TODO

Focused ESLint and full repository TypeScript passed. Three Vitest files passed with 16 tests. Playwright was not run because this wave prohibits starting `next dev`.

`docs/agents/auth-ui-needs.md` lists the required Better Auth deletion setting, shared route constant follow-up, and Google-only account deletion decision. Live deletion remains blocked until the lead enables Better Auth `user.deleteUser` in core. `docs/agents/auth-ui-checklist.md` contains the production checklist item.
