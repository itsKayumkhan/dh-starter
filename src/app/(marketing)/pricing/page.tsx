import type { Metadata } from "next";
import { Suspense, cache } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Check } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { buildMetadata } from "@/lib/seo";
import { getContent } from "@/lib/content/blocks";
import { getSiteSettings } from "@/lib/content/settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BillingActionButton } from "@/modules/billing/components/billing-action-button";
import { billingPlans, oneTimeProducts } from "@/modules/billing/plans";
import { BILLING_ROUTES } from "@/modules/billing/routes";
import { hasManagedSubscription } from "@/modules/billing/server/queries";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata(
    {
      title: "Pricing",
      description: "Choose a plan that fits your project.",
      path: BILLING_ROUTES.pricing,
    },
    settings,
  );
}

export default async function PricingPage() {
  const intro = await getContent("pricing.intro");
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6 sm:py-16">
      <header className="max-w-2xl space-y-3">
        <p className="text-primary text-sm font-semibold">{intro.eyebrow}</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {intro.title}
        </h1>
        <p className="text-muted-foreground text-lg">{intro.subtitle}</p>
      </header>
      <div className="grid gap-5 md:grid-cols-2">
        {billingPlans.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <p className="pt-3 text-3xl font-semibold">
                {plan.displayAmount}
              </p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check
                      aria-hidden="true"
                      className="text-primary mt-0.5 size-4 shrink-0"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Suspense fallback={<Skeleton className="h-9 w-32" />}>
                <PlanAction id={plan.id} name={plan.name} />
              </Suspense>
            </CardFooter>
          </Card>
        ))}
      </div>
      <section className="space-y-4" aria-labelledby="one-time-title">
        <h2 id="one-time-title" className="text-2xl font-semibold">
          {intro.servicesTitle}
        </h2>
        {oneTimeProducts.map((product) => (
          <Card key={product.id} className="max-w-xl">
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{product.displayAmount}</p>
            </CardContent>
            <CardFooter>
              <Suspense fallback={<Skeleton className="h-9 w-24" />}>
                <ProductAction id={product.id} />
              </Suspense>
            </CardFooter>
          </Card>
        ))}
      </section>
    </main>
  );
}

const cachedHasManagedSubscription = cache(hasManagedSubscription);

async function PlanAction({ id, name }: { id: string; name: string }) {
  const signedIn = Boolean(await getSession());
  if (!signedIn)
    return (
      <Button asChild>
        <Link href={ROUTES.signup}>Choose {name}</Link>
      </Button>
    );
  if (await cachedHasManagedSubscription()) {
    return (
      <BillingActionButton action={{ kind: "portal" }}>
        Manage plan
      </BillingActionButton>
    );
  }
  return (
    <BillingActionButton action={{ kind: "plan", id }}>
      Choose {name}
    </BillingActionButton>
  );
}

async function ProductAction({ id }: { id: string }) {
  const signedIn = Boolean(await getSession());
  return signedIn ? (
    <BillingActionButton action={{ kind: "product", id }}>
      Buy once
    </BillingActionButton>
  ) : (
    <Button asChild>
      <Link href={ROUTES.signup}>Buy once</Link>
    </Button>
  );
}
