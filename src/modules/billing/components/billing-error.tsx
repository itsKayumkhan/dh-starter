"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BillingError({ reset }: { reset: () => void }) {
  return <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center" role="alert">
    <AlertCircle aria-hidden="true" className="text-destructive size-10" />
    <h1 className="text-2xl font-semibold">Billing is unavailable</h1>
    <p className="text-muted-foreground">Please try again in a moment.</p>
    <Button type="button" onClick={reset}>Try again</Button>
  </main>;
}
