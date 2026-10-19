"use client";
import { MESSAGES } from "@/lib/constants/messages";
export default function GlobalError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main>
          <h1>{MESSAGES.somethingWentWrong}</h1>
          <button onClick={reset}>{MESSAGES.tryAgain}</button>
        </main>
      </body>
    </html>
  );
}
