import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { BILLING_ROUTES } from "@/modules/billing/routes";

export const metadata = buildMetadata({ title: "Checkout canceled", path: BILLING_ROUTES.cancel, noIndex: true });

export default async function BillingCancelPage() {
  await requireUser();
  return <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
    <h1 className="text-3xl font-semibold">Checkout canceled</h1>
    <p className="text-muted-foreground">No changes were made to your billing plan.</p>
    <Button asChild><Link href={BILLING_ROUTES.dashboard}>Back to billing</Link></Button>
  </main>;
}
