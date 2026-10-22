# Fix-perf follow-up outside assigned paths

The requested bundle limits remain unmet after the changes in this task. These files were outside the fix-perf edit scope and need a separate owner:

- `src/modules/contact/components/contact-form.tsx` and its wrapper: review the form and validation client bundle. `/contact` is 251.1 KiB gzip in initial scripts.
- `src/components/auth/*` and `src/app/(auth)/*`: review the auth form client bundle. Signed-out `/login` is 276.2 KiB gzip.
- `src/modules/admin/components/user-table.tsx` and `src/modules/uploads/components/media-library.tsx`: split heavy route UI where an interaction boundary permits it. `/admin/users` is 379.0 KiB and `/admin/media` is 388.2 KiB.
- `src/modules/notifications/module.ts` and its bell component: the dashboard shell's module registry eagerly imports the bell. Review an optional lazy header item contract without hardcoding module identities in core.

The current Next.js framework scripts shared by the home page are about 145.4 KiB gzip. Reassess whether a 150 KiB whole-page limit is practical for this version, or define separate budgets for shared framework code, route code, and chunks loaded after hydration.
