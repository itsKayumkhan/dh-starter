# Component test coverage

## Files created

- `src/components/shared/data-table.test.tsx`: rows, empty state, search and filter controls, pagination, and sort URL changes.
- `src/components/shared/shared-components.test.tsx`: EmptyState, PageHeader, StatCard, and ConfirmDialog display and pending states.
- `src/components/shared/ui-primitives.test.tsx`: Button, Input, and Dialog variants, disabled state, and opening.
- `src/components/auth/auth-forms.test.tsx`: login, signup, and forgot password validation, pending state, and response behavior.
- `src/modules/contact/components/contact-form.test.tsx`: honeypot, validation, pending state, and success receipt.
- `tests/setup/vitest.setup.ts`: React Testing Library cleanup and a jsdom ResizeObserver stub.

`vitest.config.mts` now loads the setup file.

## Verification

- `npx.cmd tsc --noEmit -p .`: passed.
- `npx.cmd eslint vitest.config.mts tests/setup/vitest.setup.ts src/components/shared/*.test.tsx src/components/auth/auth-forms.test.tsx src/modules/contact/components/contact-form.test.tsx`: passed.
- `npx.cmd vitest run`: 25 files and 85 tests passed.

No environment keys were added. The forgot password form deliberately shows the same generic receipt after a client error, so the test verifies that behavior instead of displaying the raw server error.
