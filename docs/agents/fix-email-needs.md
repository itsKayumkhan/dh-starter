# fix-email handoff

- Remove `@react-email/components` from `dependencies` and update `package-lock.json`. No source files import it after this migration.
- Move `react-email` version `^6.11.3` from `devDependencies` to `dependencies` and update `package-lock.json`. `src/lib/email/index.ts` and all email templates now import it at runtime, so production-only installs need it.
- The existing `email:dev` script uses `--dir src/lib/email/templates`, which is correct for the five core templates. The two contact templates live in `src/modules/contact/emails` and are not shown by this preview command. If the preview must show all seven, adjust the script or preview setup in a separate package-file task without making core import the contact module.
