import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BillingActionButton } from "@/modules/billing/components/billing-action-button";
import { formatMoney, formatShortDate } from "@/modules/billing/format";
import { billingPlans } from "@/modules/billing/plans";
import { BILLING_ROUTES } from "@/modules/billing/routes";
import { getMyBillingOverview } from "@/modules/billing/server/queries";

export const metadata = buildMetadata({
  title: "Billing",
  path: BILLING_ROUTES.dashboard,
  noIndex: true,
});

async function BillingPageContent() {
  await requireUser();
  const { subscription, activeSubscriptions, payments } =
    await getMyBillingOverview();
  const currentPlan = billingPlans.find(
    (plan) => plan.id === subscription?.planId,
  );
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <PageHeader
        title="Billing"
        description="Manage your plan and review payments."
        actions={
          <BillingActionButton action={{ kind: "portal" }} variant="outline">
            Manage billing
          </BillingActionButton>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {subscription ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xl font-semibold">
                  {currentPlan?.name ?? subscription.planId}
                </p>
                <Badge variant="outline">{subscription.status}</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {subscription.cancelAtPeriodEnd ? "Cancels" : "Renews"} on{" "}
                {formatShortDate(subscription.currentPeriodEnd)}
              </p>
              {activeSubscriptions.length > 1 ? (
                <ul>
                  {activeSubscriptions.map((item) => (
                    <li key={item.id}>
                      {billingPlans.find((plan) => plan.id === item.planId)
                        ?.name ?? item.planId}
                      : {item.status},{" "}
                      {item.cancelAtPeriodEnd ? "cancels" : "renews"} on{" "}
                      {formatShortDate(item.currentPeriodEnd)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <EmptyState
              icon={CreditCard}
              title="No active plan"
              description="Choose a plan to get started."
              action={
                <Button asChild>
                  <Link href={BILLING_ROUTES.pricing}>View pricing</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
      <section className="space-y-4" aria-labelledby="upgrade-title">
        <h2 id="upgrade-title" className="text-xl font-semibold">
          Plan options
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {billingPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {plan.displayAmount}
                </p>
              </CardHeader>
              <CardContent>
                {subscription?.planId === plan.id &&
                subscription.status !== "canceled" ? (
                  <Badge>Current plan</Badge>
                ) : subscription && subscription.status !== "canceled" ? (
                  <BillingActionButton action={{ kind: "portal" }}>
                    Change plan in portal
                  </BillingActionButton>
                ) : (
                  <BillingActionButton action={{ kind: "plan", id: plan.id }}>
                    Choose {plan.name}
                  </BillingActionButton>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="space-y-4" aria-labelledby="payments-title">
        <h2 id="payments-title" className="text-xl font-semibold">
          Payment history
        </h2>
        {payments.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatShortDate(payment.createdAt)}</TableCell>
                  <TableCell>{payment.description ?? "Payment"}</TableCell>
                  <TableCell>
                    {formatMoney(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No payments yet"
            description="Payments will appear here after checkout."
          />
        )}
      </section>
    </main>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<PageSkeleton title="Billing" variant="cards" />}>
      <BillingPageContent />
    </Suspense>
  );
}
