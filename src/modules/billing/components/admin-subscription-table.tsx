"use client";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { formatShortDate } from "@/modules/billing/format";

export type AdminSubscriptionRow = {
  id: string; userId: string; planId: string; status: string;
  currentPeriodEnd: string; cancelAtPeriodEnd: boolean; createdAt: string;
};

const columns: DataTableColumn<AdminSubscriptionRow>[] = [
  { accessorKey: "createdAt", header: "Started", cell: ({ row }) => formatShortDate(row.original.createdAt) },
  { accessorKey: "userId", header: "User", cell: ({ row }) => <span className="break-all">{row.original.userId}</span> },
  { accessorKey: "planId", header: "Plan" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge> },
  { accessorKey: "currentPeriodEnd", header: "Period ends", cell: ({ row }) => formatShortDate(row.original.currentPeriodEnd) },
  { accessorKey: "cancelAtPeriodEnd", header: "Cancellation", cell: ({ row }) => row.original.cancelAtPeriodEnd ? "Scheduled" : "None" },
];

export function AdminSubscriptionTable({ data, pageCount }: { data: AdminSubscriptionRow[]; pageCount: number }) {
  return <DataTable columns={columns} data={data} pageCount={pageCount} searchPlaceholder="Search user or plan" emptyMessage="No subscriptions found." filters={[{
    key: "status", label: "Status", options: [
      { label: "Active", value: "active" }, { label: "Trialing", value: "trialing" },
      { label: "Past due", value: "past_due" }, { label: "Canceled", value: "canceled" },
      { label: "Unpaid", value: "unpaid" },
    ],
  }]} />;
}
