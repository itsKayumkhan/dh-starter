"use client";

import { formatDate } from "@/lib/format";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { revokeUserSessions } from "@/modules/admin/server/actions";
import { ADMIN_ROUTES } from "@/modules/admin/routes";
import type { UserRow } from "@/modules/admin/server/queries";

function makeColumns(canManage: boolean): DataTableColumn<UserRow>[] { return [
  { accessorKey: "name", header: "User", cell: ({ row }) => <Link href={ADMIN_ROUTES.user(row.original.id)} className="flex min-w-44 items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-ring"><Avatar className="size-9"><AvatarImage src={row.original.image ?? undefined} alt="" /><AvatarFallback>{row.original.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><span className="min-w-0"><span className="block truncate font-medium">{row.original.name}</span><span className="text-muted-foreground block truncate text-xs">{row.original.email}</span></span></Link> },
  { accessorKey: "role", header: "Role", cell: ({ row }) => <Badge variant="secondary" className="capitalize">{row.original.role}</Badge> },
  { accessorKey: "status", header: "Status", enableSorting: false, cell: ({ row }) => <Badge variant={row.original.status === "banned" ? "destructive" : "outline"} className="capitalize">{row.original.status}</Badge> },
  { accessorKey: "createdAt", header: "Created", cell: ({ row }) => <time dateTime={row.original.createdAt}>{formatDate(row.original.createdAt)}</time> },
  { accessorKey: "lastActive", header: "Last active", enableSorting: false, cell: ({ row }) => row.original.lastActive ? <time dateTime={row.original.lastActive}>{formatDate(row.original.lastActive)}</time> : "Never" },
  { id: "actions", header: "Actions", enableSorting: false, cell: ({ row }) => <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${row.original.name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={ADMIN_ROUTES.user(row.original.id)}>View details</Link></DropdownMenuItem>{canManage && <DropdownMenuItem onSelect={() => void revokeUserSessions({ id: row.original.id }).then((result) => result.ok ? toast.success("Sessions revoked") : toast.error(result.error))}>Revoke sessions</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu> },
]; }

export function UserTable({ data, pageCount, canManage }: { data: UserRow[]; pageCount: number; canManage: boolean }) {
  return <DataTable columns={makeColumns(canManage)} data={data} pageCount={pageCount} searchPlaceholder="Search names and emails" emptyMessage="No users match your filters." filters={[
    { key: "role", label: "Role", options: [{ label: "User", value: "user" }, { label: "Staff", value: "staff" }, { label: "Admin", value: "admin" }] },
    { key: "status", label: "Status", options: [{ label: "Active", value: "active" }, { label: "Banned", value: "banned" }, { label: "Unverified", value: "unverified" }] },
  ]} />;
}
