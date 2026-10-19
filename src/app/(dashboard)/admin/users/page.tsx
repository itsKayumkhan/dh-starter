import { requirePermission } from "@/lib/auth/session";
import { parseListParams, pageCount } from "@/lib/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { InviteUserDialog } from "@/modules/admin/components/user-forms";
import { UserTable } from "@/modules/admin/components/user-table";
import { listUsers } from "@/modules/admin/server/queries";

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const currentUser = await requirePermission("users:read");
  const params = parseListParams(await searchParams, { sortable: ["name", "email", "role", "createdAt"], filters: ["role", "status"], defaultSort: { field: "createdAt", dir: "desc" } });
  const result = await listUsers({ ...params, sort: { field: params.sort.field, dir: params.sort.dir === "asc" ? "asc" : "desc" } });
  return <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8"><PageHeader title="Users" description="Manage access and review account activity." actions={currentUser.role === "admin" ? <InviteUserDialog /> : undefined} /><UserTable data={result.data} pageCount={pageCount(result.total, params.pageSize)} canManage={currentUser.role === "admin"} /></main>;
}
