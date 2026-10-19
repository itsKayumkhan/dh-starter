"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { openCustomerPortal, startOneTimeCheckout, startSubscriptionCheckout } from "@/modules/billing/server/actions";

type BillingAction = { kind: "plan"; id: string } | { kind: "product"; id: string } | { kind: "portal" };

export function BillingActionButton({ action, children, variant = "default" }: {
  action: BillingAction;
  children: React.ReactNode;
  variant?: "default" | "outline";
}) {
  const [pending, startTransition] = useTransition();
  function handleClick() {
    startTransition(async () => {
      const result = action.kind === "plan"
        ? await startSubscriptionCheckout(action.id)
        : action.kind === "product"
          ? await startOneTimeCheckout(action.id)
          : await openCustomerPortal();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      window.location.assign(result.data.url);
    });
  }
  return <Button type="button" variant={variant} onClick={handleClick} disabled={pending} aria-busy={pending}>
    {pending ? "Opening Stripe..." : children}
  </Button>;
}
