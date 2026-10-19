"use client";

import { Button } from "@/components/ui/button";
import { MESSAGES } from "@/lib/constants/messages";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div role="alert" className="rounded-xl border p-6">
    <h1 className="text-lg font-semibold">Dashboard unavailable</h1>
    <p className="mt-2 text-sm text-muted-foreground">{MESSAGES.somethingWentWrong}</p>
    <Button className="mt-4" onClick={reset}>{MESSAGES.tryAgain}</Button>
  </div>;
}
