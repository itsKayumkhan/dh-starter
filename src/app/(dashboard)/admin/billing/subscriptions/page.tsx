import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { AdminSubscriptionTable } from "@/modules/billing/components/admin-subscription-table";
import { BILLING_ROUTES } from "@/modules/billing/routes";
import { getAdminSubscriptions } from "@/modules/billing/server/queries";

export const metadata = buildMetadata({ title: "Subscriptions", path: BILLING_ROUTES.adminSubscriptions, noIndex: true });

export default async function AdminSubscriptionsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("billing:manage");
  const list = await getAdminSubscriptions(await searchParams);
  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
    <PageHeader title="Subscriptions" description="Review subscription status and renewal dates." actions={<Button asChild variant="outline"><Link href={BILLING_ROUTES.admin}>Payments</Link></Button>} />
    <AdminSubscriptionTable data={list.data} pageCount={list.pageCount} />
  </main>;
}
