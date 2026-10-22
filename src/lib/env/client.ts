import { z } from "zod";
import { formatEnvError } from "@/lib/env/format-env-error";

const parsedClientEnv = z.object({ NEXT_PUBLIC_APP_URL: z.url() }).safeParse({
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : "http://localhost:3000"),
});
if (!parsedClientEnv.success)
  throw new Error(
    formatEnvError(parsedClientEnv.error, { source: ".env.example" }),
  );

export const APP_URL = parsedClientEnv.data.NEXT_PUBLIC_APP_URL;
