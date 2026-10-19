"use client";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatShortDate } from "@/modules/billing/format";

export type AdminPaymentRow = {
  id: string; userId: string; amount: number; currency: string;
  status: string; description: string | null; createdAt: string;
};

const columns: DataTableColumn<AdminPaymentRow>[] = [
  { accessorKey: "createdAt", header: "Date", cell: ({ row }) => formatShortDate(row.original.createdAt) },
  { accessorKey: "userId", header: "User", cell: ({ row }) => <span className="break-all">{row.original.userId}</span> },
  { accessorKey: "amount", header: "Amount", cell: ({ row }) => formatMoney(row.original.amount, row.original.currency) },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge> },
  { accessorKey: "description", header: "Description", cell: ({ row }) => row.original.description ?? "-" },
];

export function AdminPaymentTable({ data, pageCount }: { data: AdminPaymentRow[]; pageCount: number }) {
  return <DataTable columns={columns} data={data} pageCount={pageCount} searchPlaceholder="Search user or description" emptyMessage="No payments found." filters={[{
    key: "status", label: "Status", options: [
      { label: "Succeeded", value: "succeeded" }, { label: "Failed", value: "failed" },
      { label: "Refunded", value: "refunded" }, { label: "Partially refunded", value: "partially_refunded" },
    ],
  }]} />;
}
