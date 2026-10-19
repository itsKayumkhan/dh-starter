"use client";
import { useEffect } from "react";
import { logger } from "@/lib/logger";
import { MESSAGES } from "@/lib/constants/messages";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Page error", { error });
  }, [error]);
  return (
    <main className="mx-auto max-w-lg p-12">
      <h1 className="text-2xl font-semibold">{MESSAGES.somethingWentWrong}</h1>
      <button
        className="bg-primary text-primary-foreground mt-5 rounded-md px-4 py-2"
        onClick={reset}
      >
        {MESSAGES.tryAgain}
      </button>
    </main>
  );
}
