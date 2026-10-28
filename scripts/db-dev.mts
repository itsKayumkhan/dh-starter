// Local development Postgres (real Postgres 17 binaries from npm, no Docker or system install).
// Reads host, port, user, password and database name from DATABASE_URL in .env, keeps data in
// .data/postgres-<port>/ and runs until Ctrl+C.
import "dotenv/config";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const raw = process.env.DATABASE_URL;
if (!raw) {
  process.stderr.write(
    "DATABASE_URL is missing. Copy .env.example to .env first.\n",
  );
  process.exit(1);
}
const url = new URL(raw);
if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
  process.stderr.write(
    `DATABASE_URL points at ${url.hostname}; db:dev only runs a local database.\n`,
  );
  process.exit(1);
}

const port = Number(url.port || 5432);
const user = decodeURIComponent(url.username || "postgres");
const password = decodeURIComponent(url.password || "postgres");
const database = url.pathname.replace(/^\//, "") || "postgres";
const databaseDir = resolve(".data", `postgres-${port}`);
const verbose = process.argv.includes("--verbose");

// Postgres owns its lock. A second db:dev process must not remove a live cluster's lock.
const pidFile = resolve(databaseDir, "postmaster.pid");
if (existsSync(pidFile)) {
  const pid = Number(readFileSync(pidFile, "utf8").split(/\r?\n/, 1)[0]);
  let live = false;
  if (Number.isSafeInteger(pid) && pid > 0) {
    try {
      process.kill(pid, 0);
      live = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EPERM") live = true;
    }
  }
  if (live)
    throw new Error(
      `Postgres is already running for ${databaseDir} (PID ${pid}). Stop it before starting db:dev again.`,
    );
  // The recorded process is gone (crash or reboot): the lock is stale and safe to remove.
  rmSync(pidFile);
  process.stdout.write(`Removed stale Postgres lock ${pidFile}\n`);
}

const pg = new EmbeddedPostgres({
  databaseDir,
  user,
  password,
  port,
  persistent: true,
  onLog: (message) => {
    if (verbose) process.stdout.write(message);
  },
  onError: (error) => process.stderr.write(`${String(error)}\n`),
});

if (!existsSync(resolve(databaseDir, "PG_VERSION"))) {
  process.stdout.write(
    `Creating a new local Postgres cluster in ${databaseDir}\n`,
  );
  await pg.initialise();
}

await pg.start();

const client = pg.getPgClient();
await client.connect();
const found = await client.query(
  "select 1 from pg_database where datname = $1",
  [database],
);
await client.end();
if (found.rowCount === 0) await pg.createDatabase(database);

process.stdout.write(
  `Local Postgres ready on localhost:${port}, database "${database}". Press Ctrl+C to stop.\n`,
);

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  process.stdout.write("Stopping local Postgres...\n");
  await pg.stop();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
setInterval(() => {}, 1 << 30);
