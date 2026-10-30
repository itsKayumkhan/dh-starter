import "dotenv/config";
import pg from "pg";
import { requireLocalE2ESetup } from "@/lib/env/test";

// The seed accounts sign in many times per run from one IP, and Better Auth allows 3 sign-ins
// per 10 seconds. Clearing the counters (local database only) keeps results independent of timing.
export async function resetRateLimits() {
  const client = new pg.Client({ connectionString: requireLocalE2ESetup() });
  await client.connect();
  try {
    await client.query('delete from "rateLimit"');
    await client.query('delete from "AppRateLimit"');
  } finally {
    await client.end();
  }
}
