import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo";
import { pageCount, parseListParams } from "@/lib/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { InquiriesTable } from "@/modules/contact/components/inquiries-table";
import { CONTACT_ROUTES } from "@/modules/contact/routes";
import { inquiryStatusSchema } from "@/modules/contact/schemas/inquiry";
import { listInquiries } from "@/modules/contact/server/inquiries";

export const metadata: Metadata = buildMetadata({
  title: "Inquiries",
  path: CONTACT_ROUTES.inquiries,
  noIndex: true,
});

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("inquiries:read");
  const params = parseListParams(await searchParams, {
    sortable: ["createdAt", "name", "status"] as const,
    filters: ["status"] as const,
    defaultSort: { field: "createdAt", dir: "desc" },
  });
  const status = inquiryStatusSchema.safeParse(params.filters.status).data;
  const results = await listInquiries({
    skip: params.skip,
    take: params.take,
    q: params.q,
    sort: {
      field: params.sort.field,
      dir: params.sort.dir === "asc" ? "asc" : "desc",
    },
    status,
  });
  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <PageHeader title="Inquiries" description="Review messages sent through the contact form." />
      <InquiriesTable data={results.data} pageCount={pageCount(results.total, params.pageSize)} />
    </main>
  );
}
