"use client";

import { formatDateTime } from "@/lib/format";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { AuditRow } from "@/modules/admin/server/queries";

const columns: DataTableColumn<AuditRow>[] = [
  { accessorKey: "action", header: "Action", cell: ({ row }) => <span className="font-medium">{row.original.action}</span> },
  { id: "actor", header: "Actor", enableSorting: false, cell: ({ row }) => <span className="block min-w-32"><span className="block">{row.original.actorName ?? "System or deleted user"}</span><span className="text-muted-foreground block text-xs">{row.original.actorEmail ?? row.original.actorId ?? ""}</span></span> },
  { id: "target", header: "Target", enableSorting: false, cell: ({ row }) => <span>{row.original.targetType}{row.original.targetId ? `: ${row.original.targetId}` : ""}</span> },
  { accessorKey: "createdAt", header: "Time", cell: ({ row }) => <time dateTime={row.original.createdAt}>{formatDateTime(row.original.createdAt)}</time> },
  { id: "meta", header: "Details", enableSorting: false, cell: ({ row }) => <Sheet><SheetTrigger asChild><Button variant="outline" size="sm">View meta</Button></SheetTrigger><SheetContent className="overflow-y-auto"><SheetHeader><SheetTitle>{row.original.action}</SheetTitle><SheetDescription>{formatDateTime(row.original.createdAt)}</SheetDescription></SheetHeader><div className="p-4"><p className="text-muted-foreground mb-2 text-sm">Target: {row.original.targetType} {row.original.targetId}</p><pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs whitespace-pre-wrap break-all">{JSON.stringify(row.original.meta, null, 2)}</pre></div></SheetContent></Sheet> },
];

export function AuditTable({ data, pageCount, actions }: { data: AuditRow[]; pageCount: number; actions: string[] }) {
  return <DataTable columns={columns} data={data} pageCount={pageCount} searchPlaceholder="Search action or target ID" emptyMessage="No audit entries match your filters." filters={[{ key: "action", label: "Action", options: actions.map((action) => ({ label: action, value: action })) }]} />;
}
