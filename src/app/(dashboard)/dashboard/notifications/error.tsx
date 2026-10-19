"use client";

import { Button } from "@/components/ui/button";
import { NOTIFICATION_MESSAGES } from "@/modules/notifications/messages";

export default function NotificationsError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-3 px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold">
        {NOTIFICATION_MESSAGES.unavailable}
      </h1>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
