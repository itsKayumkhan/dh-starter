# Shell integration needs

- The installed `@tanstack/react-table` is v9.3.1. Its `ColumnDef` type is `ColumnDef<TFeatures, TData, TValue>` and its hook is `useTable`. The wave contract's `ColumnDef<TData, unknown>[]` and `useReactTable` are v8 signatures, so they cannot typecheck with this package. `DataTable` accepts the v9 alias `DataTableColumn<TData>[]` exported from `@/components/shared/data-table`. Other agents updated their table consumers to that alias while this wave was in progress, and the full TypeScript check now passes.
- Update the written shared contract for future work to the v9 alias. No package files were changed here.
