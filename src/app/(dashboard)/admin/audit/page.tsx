import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requirePermission } from "@/lib/auth/session";
import { parseListParams, pageCount } from "@/lib/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuditTable } from "@/modules/admin/components/audit-table";
import { ADMIN_ROUTES } from "@/modules/admin/routes";
import { listAuditActions, listAuditLogs } from "@/modules/admin/server/queries";

async function AuditPageContent({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("audit:read");
  const params = parseListParams(await searchParams, { sortable: ["action", "createdAt"], filters: ["action", "actor", "from", "to"], defaultSort: { field: "createdAt", dir: "desc" } });
  const [result, actions] = await Promise.all([listAuditLogs({ ...params, sort: { field: params.sort.field, dir: params.sort.dir === "asc" ? "asc" : "desc" } }), listAuditActions()]);
  return <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8"><PageHeader title="Audit log" description="Review administrative activity and changes." />
    <form method="get" action={ADMIN_ROUTES.audit} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
      <input type="hidden" name="q" value={params.q} />
      <input type="hidden" name="action" value={params.filters.action ?? ""} />
      <input type="hidden" name="sort" value={`${params.sort.field}:${params.sort.dir}`} />
      <input type="hidden" name="pageSize" value={params.pageSize} />
      <Field><FieldLabel htmlFor="audit-actor">Actor ID</FieldLabel><Input id="audit-actor" name="actor" defaultValue={params.filters.actor ?? ""} maxLength={128} placeholder="User ID" /></Field>
      <Field><FieldLabel htmlFor="audit-from">From</FieldLabel><Input id="audit-from" type="date" name="from" defaultValue={params.filters.from ?? ""} /></Field>
      <Field><FieldLabel htmlFor="audit-to">To</FieldLabel><Input id="audit-to" type="date" name="to" defaultValue={params.filters.to ?? ""} /></Field>
      <Button type="submit">Apply dates</Button>
    </form>
    <AuditTable data={result.data} pageCount={pageCount(result.total, params.pageSize)} actions={actions} />
  </main>;
}

export default function AuditPage(props: Parameters<typeof AuditPageContent>[0]) {
  return <Suspense fallback={<PageSkeleton title="Audit log" />}><AuditPageContent {...props} /></Suspense>;
}
