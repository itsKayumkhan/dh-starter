"use client";

import { useEffect, useState, useTransition } from "react";
import {
  rowSortingFeature, tableFeatures, useTable,
  type ColumnDef, type RowData, type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryState, useQueryStates } from "nuqs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Filter = { key: string; label: string; options: { label: string; value: string }[] };
const features = tableFeatures({ rowSortingFeature });
export type DataTableColumn<TData extends RowData> = ColumnDef<typeof features, TData, unknown>;
const listParsers = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
  q: parseAsString.withDefault(""),
  sort: parseAsString.withDefault(""),
};

function TableFilter({ filter, onChange, startTransition }: {
  filter: Filter;
  onChange: () => void;
  startTransition: ReturnType<typeof useTransition>[1];
}) {
  const [value, setValue] = useQueryState(filter.key, parseAsString.withOptions({ shallow: false, startTransition }));
  return <Select value={value || "all"} onValueChange={(next) => {
    onChange();
    void setValue(next === "all" ? null : next);
  }}>
    <SelectTrigger aria-label={filter.label} className="w-full sm:w-44"><SelectValue placeholder={filter.label} /></SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All {filter.label.toLowerCase()}</SelectItem>
      {filter.options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
    </SelectContent>
  </Select>;
}

function SearchBox({ initialValue, placeholder, onSearch }: {
  initialValue: string;
  placeholder: string;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (value === initialValue) return;
    const timer = window.setTimeout(() => onSearch(value.trim().slice(0, 100)), 350);
    return () => window.clearTimeout(timer);
  }, [value, initialValue, onSearch]);
  return (
    <Input
      aria-label="Search table"
      className="w-full sm:max-w-xs"
      placeholder={placeholder}
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

export function DataTable<TData extends RowData>({ columns, data, pageCount, searchPlaceholder = "Search...", filters = [], emptyMessage = "No results found." }: {
  columns: DataTableColumn<TData>[];
  data: TData[];
  pageCount: number;
  searchPlaceholder?: string;
  filters?: Filter[];
  emptyMessage?: string;
}) {
  const [pending, startTransition] = useTransition();
  const validFilters = filters.filter((filter) => !["page", "pageSize", "q", "sort"].includes(filter.key));
  const [params, setParams] = useQueryStates(listParsers, { shallow: false, startTransition });
  const currentPage = Math.max(1, params.page);
  const currentPageSize = [10, 20, 50, 100].includes(params.pageSize) ? params.pageSize : 20;
  const [sortField, sortDirection] = params.sort.split(":");
  const sorting: SortingState = sortField && (sortDirection === "asc" || sortDirection === "desc")
    ? [{ id: sortField, desc: sortDirection === "desc" }]
    : [];
  const table = useTable({
    features,
    columns,
    data,
    manualSorting: true,
    state: { sorting },
  });

  return (
    <div className="space-y-4" aria-busy={pending}>
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox
          key={params.q}
          initialValue={params.q}
          placeholder={searchPlaceholder}
          onSearch={(value) => void setParams({ q: value || null, page: 1 })}
        />
        {validFilters.map((filter) => <TableFilter key={filter.key} filter={filter} onChange={() => void setParams({ page: 1 })} startTransition={startTransition} />)}
        {pending && <span role="status" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Loading</span>}
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3"
                        onClick={() => {
                          const direction = sortField === header.column.id && sortDirection === "asc" ? "desc" : "asc";
                          void setParams({ sort: `${header.column.id}:${direction}`, page: 1 });
                        }}
                        aria-label={`Sort by ${header.column.id}`}
                      >
                        <table.FlexRender header={header} />
                        {sortField === header.column.id ? (sortDirection === "asc" ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />) : <ArrowUpDown aria-hidden="true" />}
                      </Button>
                    ) : <table.FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => <TableCell key={cell.id}><table.FlexRender cell={cell} /></TableCell>)}
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground">{emptyMessage}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select value={String(currentPageSize)} onValueChange={(value) => void setParams({ pageSize: Number(value), page: 1 })}>
            <SelectTrigger aria-label="Rows per page" className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>{[10, 20, 50, 100].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span>Page {currentPage} of {Math.max(1, pageCount)}</span>
          <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={pending || currentPage <= 1} onClick={() => void setParams({ page: currentPage - 1 })}><ChevronLeft aria-hidden="true" /></Button>
          <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={pending || currentPage >= pageCount} onClick={() => void setParams({ page: currentPage + 1 })}><ChevronRight aria-hidden="true" /></Button>
        </div>
      </div>
    </div>
  );
}
