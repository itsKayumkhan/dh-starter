# fix-auth-ux summary

## Changed

- `src/lib/auth/session.ts`: page role and permission guards now invoke Next's `forbidden()` interrupt. Action guards still throw AppErrors. Session lookup preserves Next control-flow errors.
- `src/app/forbidden.tsx`: branded 403 page with a dashboard button. `next.config.ts` enables `authInterrupts`.
- `src/app/(dashboard)/admin/inquiries/[id]/page.tsx`: rethrows Next control-flow errors before mapping a domain not-found error.
- `src/lib/env/format-env-error.ts`: formats Zod issues as short key-specific messages without values. Server and client env validation use it.
- `src/instrumentation.ts`: exits with status 1 and logs the formatted error for invalid production Node.js runtime configuration. The build phase is excluded.
- `src/lib/auth/session.test.ts` and `src/lib/env/format-env-error.test.ts`: guard and error-formatting coverage.

## How to verify

- `npx.cmd tsc --noEmit -p .`: passed.
- `npx.cmd eslint` on changed TypeScript and TSX files: passed.
- `npx.cmd vitest run src/lib/auth/session.test.ts src/lib/env/format-env-error.test.ts`: 7 tests passed.
- `git diff --check` on changed tracked files: passed.

## Environment and remaining work

No new environment keys. Copy `.env.example` to `.env` and set required values. No build, server, or browser run was performed in this task wave. The production exit path and rendered 403 page need the wave's permitted integration check.
