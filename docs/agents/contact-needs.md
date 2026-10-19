# Contact integration needs

- The lead must add the `contactModule` import and `installedModules` entry to `src/config/modules.ts`, each ending with `// module:contact`. This file is outside contact ownership for this wave.
- The installed TanStack Table is v9.3.1, whose `ColumnDef` takes a feature type before row data. The shell adapted DataTable to export `DataTableColumn<TData>` using v9. Contact now uses that exported type. The original `ColumnDef<TData, unknown>` signature from the task cannot typecheck against this installed package.
- The shared `parseListParams` currently infers `sort.dir` as `string`. Contact narrows it at its page boundary, but the shell can preserve `"asc" | "desc"` in the helper return type for other consumers.
- The shared admin layout now guards staff and admin roles, and contact pages re-check `inquiries:read`. No contact-side layout change is needed.
