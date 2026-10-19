"use client";

import { Button } from "@/components/ui/button";

export default function InquiriesError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-12" role="alert">
      <h1 className="text-2xl font-semibold">Inquiries are unavailable</h1>
      <p className="text-muted-foreground">Please try loading this page again.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
