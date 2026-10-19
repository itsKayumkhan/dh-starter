import { z } from "zod";

export function getTestBaseURL() {
  return z
    .url()
    .parse(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
}
