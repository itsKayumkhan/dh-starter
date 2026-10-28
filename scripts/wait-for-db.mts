import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

for (let attempt = 0; attempt < 60; attempt++) {
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 1000,
  });
  try {
    await client.connect();
    await client.query("select 1");
    await client.end();
    process.stdout.write("Database ready.\n");
    process.exit(0);
  } catch {
    await client.end().catch(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
throw new Error("Database did not become ready within 120 seconds");
