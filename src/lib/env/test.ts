import { z } from "zod";

export function getTestBaseURL() {
  return z
    .url()
    .parse(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
}

/** DATABASE_URL only when it points at a local database, otherwise null (never touch a remote DB from tests). */
export function getLocalTestDatabaseUrl() {
  const parsed = z.url().safeParse(process.env.DATABASE_URL);
  if (!parsed.success) return null;
  const { hostname } = new URL(parsed.data);
  return ["localhost", "127.0.0.1"].includes(hostname) ? parsed.data : null;
}
