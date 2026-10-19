import { z } from "zod";

const clientEnv = z.object({ NEXT_PUBLIC_APP_URL: z.url() }).parse({
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : "http://localhost:3000"),
});

export const APP_URL = clientEnv.NEXT_PUBLIC_APP_URL;
