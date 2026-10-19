"use client";

import { Button } from "@/components/ui/button";

export default function AuditError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-4xl space-y-4 p-8"><h1 className="text-2xl font-semibold">Could not load audit log</h1><p className="text-muted-foreground">Please try again.</p><Button onClick={reset}>Retry</Button></main>;
}
