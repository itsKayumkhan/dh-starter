import "dotenv/config";
import pg from "pg";
import { getLocalTestDatabaseUrl } from "@/lib/env/test";

// Each run signs in many times with the same seed accounts, which trips the sign-in rate limit
// on back-to-back runs. Reset the counters before a run, only for a local database.
export default async function globalSetup() {
  const connectionString = getLocalTestDatabaseUrl();
  if (!connectionString) return;

  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query('delete from "rateLimit"');
    await client.query('delete from "AppRateLimit"');
  } finally {
    await client.end();
  }
}
