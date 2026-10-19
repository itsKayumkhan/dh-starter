# Auth UI core changes needed

1. In `src/lib/auth/server.ts`, add `user: { deleteUser: { enabled: true } }` to the `betterAuth()` options. Better Auth currently rejects the account deletion endpoint when this option is absent. The danger zone uses a password confirmation and calls that endpoint through a guarded server action. Verify the behavior against a real database before release.
2. Add `forgotPassword`, `resetPassword`, `verifyEmail`, and `account` to `src/lib/constants/routes.ts` when the shared core can be edited. This task keeps the paths in `src/components/auth/routes.ts` because core edits are disallowed for this wave.
3. If deletion must support Google-only accounts, define an additional reauthentication path. The current product requirement asks for password confirmation, so accounts without a credential password cannot complete deletion.
