import { z } from "zod";
import { getTestBaseURL } from "@/lib/env/test";

export function hasLocalAdminE2ESetup() {
  const database = z.url().safeParse(process.env.DATABASE_URL);
  const host = new URL(getTestBaseURL()).hostname;
  return database.success && (host === "localhost" || host === "127.0.0.1");
}
