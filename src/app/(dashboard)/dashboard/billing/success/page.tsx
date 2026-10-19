import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { BILLING_ROUTES } from "@/modules/billing/routes";

export const metadata = buildMetadata({ title: "Checkout complete", path: BILLING_ROUTES.success, noIndex: true });

async function BillingSuccessPageContent() {
  await requireUser();
  return <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
    <CircleCheck aria-hidden="true" className="text-primary size-10" />
    <h1 className="text-3xl font-semibold">Checkout complete</h1>
    <p className="text-muted-foreground">Stripe is confirming your payment. Your billing page will update when confirmation arrives.</p>
    <Button asChild><Link href={BILLING_ROUTES.dashboard}>View billing</Link></Button>
  </main>;
}

export default function BillingSuccessPage() {
  return <Suspense fallback={<PageSkeleton title="Checkout complete" variant="cards" />}><BillingSuccessPageContent /></Suspense>;
}
