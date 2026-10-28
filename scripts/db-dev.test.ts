// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, test } from "vitest";

test("db-dev leaves a live Postgres PID lock in place", async () => {
  const fixture = await mkdtemp(join(tmpdir(), "dh-db-lock-"));
  try {
    const dataDir = join(fixture, ".data", "postgres-5549");
    await mkdir(dataDir, { recursive: true });
    await writeFile(join(dataDir, "PG_VERSION"), "17\n");
    const lock = `${process.pid}\n${dataDir}\n`;
    await writeFile(join(dataDir, "postmaster.pid"), lock);
    const result = spawnSync(
      process.execPath,
      [resolve("scripts/db-dev.mts")],
      {
        cwd: fixture,
        env: {
          ...process.env,
          DATABASE_URL: "postgres://postgres:postgres@localhost:5549/dh_test",
        },
        encoding: "utf8",
      },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`(PID ${process.pid})`);
    expect(await readFile(join(dataDir, "postmaster.pid"), "utf8")).toBe(lock);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
