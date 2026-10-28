"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { CONTACT_ROUTES } from "@/modules/contact/routes";
import type { InquiryDto } from "@/modules/contact/server/inquiries";

const columns: DataTableColumn<InquiryDto>[] = [
  {
    accessorKey: "name",
    header: "From",
    cell: ({ row }) => (
      <div className="min-w-32">
        <Link
          href={CONTACT_ROUTES.inquiry(row.original.id)}
          className="text-foreground focus-visible:outline-ring font-medium underline-offset-4 hover:underline"
        >
          {row.original.name}
        </Link>
        <p className="text-muted-foreground text-xs">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: "subject",
    header: "Subject",
    enableSorting: false,
    cell: ({ row }) => row.original.subject || "General inquiry",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "closed" ? "secondary" : "outline"}
      >
        {row.original.status.replace("_", " ")}
      </Badge>
    ),
  },
  {
    accessorKey: "notificationEmailStatus",
    header: "Team email",
    enableSorting: false,
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.notificationEmailStatus === "failed"
            ? "destructive"
            : "outline"
        }
      >
        {row.original.notificationEmailStatus}
      </Badge>
    ),
  },
  {
    accessorKey: "autoReplyEmailStatus",
    header: "Auto-reply",
    enableSorting: false,
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.autoReplyEmailStatus === "failed"
            ? "destructive"
            : "outline"
        }
      >
        {row.original.autoReplyEmailStatus}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Received",
    cell: ({ row }) =>
      `${row.original.createdAt.slice(0, 16).replace("T", " ")} UTC`,
  },
];

export function InquiriesTable({
  data,
  pageCount,
}: {
  data: InquiryDto[];
  pageCount: number;
}) {
  return (
    <DataTable
      columns={columns}
      data={data}
      pageCount={pageCount}
      searchPlaceholder="Search inquiries..."
      filters={[
        {
          key: "status",
          label: "Status",
          options: [
            { label: "New", value: "new" },
            { label: "In progress", value: "in_progress" },
            { label: "Closed", value: "closed" },
          ],
        },
      ]}
      emptyMessage="No inquiries found."
    />
  );
}
