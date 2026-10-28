import { z } from "zod";

export function getSeedEnv() {
  const env = z
    .object({
      DATABASE_URL: z.url(),
      BETTER_AUTH_SECRET: z.string().min(32),
      BETTER_AUTH_URL: z.url(),
      NODE_ENV: z.enum(["development", "test", "production"]).optional(),
      SEED_CONFIRM_REMOTE: z.string().optional(),
    })
    .parse(process.env);
  const hostname = new URL(env.DATABASE_URL).hostname.toLowerCase();
  const isLocal = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname);
  if (env.NODE_ENV === "production" || !isLocal) {
    if (
      !process.argv.includes("--allow-remote") ||
      env.SEED_CONFIRM_REMOTE !== "CREATE_KNOWN_SEED_USERS"
    )
      throw new Error(
        "Seed blocked: production or remote database requires --allow-remote and SEED_CONFIRM_REMOTE=CREATE_KNOWN_SEED_USERS.",
      );
  }
  return env;
}
