// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterAll, beforeAll, expect, test } from "vitest";

const scriptDir = resolve(process.cwd(), "scripts");
let fixture: string;

async function put(path: string, content: string) {
  const full = join(fixture, path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, content);
}

function run(script: string, ...args: string[]) {
  return spawnSync(process.execPath, [join(scriptDir, script), ...args], {
    cwd: fixture,
    encoding: "utf8",
  });
}

beforeAll(async () => {
  fixture = await mkdtemp(join(tmpdir(), "dh-module-scripts-"));
  await put(
    "src/modules/contact/module.json",
    JSON.stringify({
      id: "contact",
      name: "Contact",
      description: "Contact module",
      paths: ["src/modules/contact"],
      prismaFiles: [],
      packages: [],
      envKeys: [],
      dependsOn: [],
    }),
  );
  await put("src/modules/contact/module.ts", "export const contact = true;\n");
  await put(
    "src/config/modules.ts",
    'import "@/modules/contact/module"; // module:contact\n',
  );
  await put(".env.example", "");
});

afterAll(async () => {
  if (fixture) await rm(fixture, { recursive: true, force: true });
});

test("project features can import an installed module while core cannot", async () => {
  await put(
    "src/features/example/use.ts",
    'import "@/modules/contact/module";\n',
  );
  expect(run("check-boundaries.mts").status).toBe(0);

  await put("src/lib/module-use.ts", 'import "@/modules/contact/module";\n');
  const result = run("check-boundaries.mts");
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("src/lib/module-use.ts:1:");
  expect(result.stderr).not.toContain("src/features/example/use.ts:1:");
});

test("removal preview lists references and removal stops before changes", async () => {
  const preview = run("module-remove.mts", "contact", "--dry-run");
  expect(preview.status).toBe(0);
  expect(preview.stdout).toContain("src/features/example/use.ts:1:");
  expect(preview.stdout).toContain("src/lib/module-use.ts:1:");
  expect(preview.stdout).toContain("Would delete src/modules/contact");

  const blocked = run("module-remove.mts", "contact");
  expect(blocked.status).toBe(1);
  expect(blocked.stderr).toContain("src/lib/module-use.ts:1:");
  expect(blocked.stderr).toContain("Pass --force");
  expect(
    await readFile(join(fixture, "src/modules/contact/module.json"), "utf8"),
  ).toContain('"id":"contact"');
  expect(
    await readFile(join(fixture, "src/config/modules.ts"), "utf8"),
  ).toContain("module:contact");
});
