# Admin integration needs

- Register `adminModule` in `src/config/modules.ts` using the `// module:admin` import and list markers. This file is owned by the shell agent in this wave.
- The shared admin layout now admits staff and admin. Each owned admin page and mutation still checks its own permission.
- The shell agent adapted the shared `DataTable` to installed `@tanstack/react-table` 9.3.1 and exported `DataTableColumn<TData>`. Admin user and audit tables use that type. Other modules still using the originally announced `ColumnDef<TData, unknown>` signature need to adapt to the current shared type before full repository typecheck can pass.
- Give `src/lib/pagination.ts` an explicit `"asc" | "desc"` return type for `sort.dir`. Its inferred return is currently `string`, so owned pages narrow that field before passing it to queries.
- Confirm that the auth UI reset page accepts the Better Auth callback `token` query parameter. The invite email uses this existing reset flow.
