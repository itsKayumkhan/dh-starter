import { z } from "zod";

export function getSeedEnv() {
  return z
    .object({
      DATABASE_URL: z.url(),
      BETTER_AUTH_SECRET: z.string().min(32),
      BETTER_AUTH_URL: z.url(),
    })
    .parse(process.env);
}
