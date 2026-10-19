# Billing shared-file integration needs

- Register `billingModule` in `src/config/modules.ts` using the required `// module:billing` markers. Billing does not own this shared file.
- The shared DataTable was updated during this wave to use TanStack v9 and export `DataTableColumn<TData>`. Billing admin tables now use that type. Keep this alias stable while integrating the module.
- `src/lib/auth/session.ts` infers `requireUser`'s optional `next` parameter as the literal `/dashboard`, so billing pages call `requireUser()` without a return destination. Widen the core signature to `next: string = ROUTES.dashboard` if deep-link return after sign-in is desired.
