import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { AdminPaymentTable } from "@/modules/billing/components/admin-payment-table";
import { BILLING_ROUTES } from "@/modules/billing/routes";
import { getAdminPayments } from "@/modules/billing/server/queries";

export const metadata = buildMetadata({ title: "Payments", path: BILLING_ROUTES.admin, noIndex: true });

async function AdminBillingPageContent({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("billing:manage");
  const list = await getAdminPayments(await searchParams);
  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
    <PageHeader title="Payments" description="Review customer payment activity." actions={<Button asChild variant="outline"><Link href={BILLING_ROUTES.adminSubscriptions}>Subscriptions</Link></Button>} />
    <AdminPaymentTable data={list.data} pageCount={list.pageCount} />
  </main>;
}

export default function AdminBillingPage(props: Parameters<typeof AdminBillingPageContent>[0]) {
  return <Suspense fallback={<PageSkeleton title="Payments" />}><AdminBillingPageContent {...props} /></Suspense>;
}
