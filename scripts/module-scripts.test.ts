// @vitest-environment node
import { spawnSync } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";

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

beforeEach(async () => {
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

afterEach(async () => {
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
  await put(
    "src/features/example/use.ts",
    'import "@/modules/contact/module";\n',
  );
  await put("src/lib/module-use.ts", 'import "@/modules/contact/module";\n');
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

test("rejects shell syntax in manifest package names before any removal", async () => {
  const path = join(fixture, "src/modules/contact/module.json");
  const manifest = JSON.parse(await readFile(path, "utf8"));
  manifest.packages = ["stripe & echo INJECTED"];
  await writeFile(path, JSON.stringify(manifest));
  const result = run("module-remove.mts", "contact", "--dry-run");
  expect(result.status).toBe(1);
  expect(result.stdout).not.toContain("Would uninstall");
  expect(
    await readFile(join(fixture, "src/modules/contact/module.ts"), "utf8"),
  ).toContain("contact");
});

test("rejects shared route files even when listed in the manifest", async () => {
  await put(
    "src/app/(dashboard)/layout.tsx",
    "export default function Layout() { return null; }\n",
  );
  const path = join(fixture, "src/modules/contact/module.json");
  const manifest = JSON.parse(await readFile(path, "utf8"));
  manifest.paths.push("src/app/(dashboard)/layout.tsx");
  await writeFile(path, JSON.stringify(manifest));
  const result = run("module-remove.mts", "contact", "--dry-run");
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Unsafe path");
  expect(
    await readFile(join(fixture, "src/app/(dashboard)/layout.tsx"), "utf8"),
  ).toContain("Layout");
});

test("rejects symlinks in deletion targets", async () => {
  const outside = await mkdtemp(join(tmpdir(), "dh-outside-"));
  try {
    await put("src/app/(dashboard)/admin/.keep", "");
    await symlink(
      outside,
      join(fixture, "src/app/(dashboard)/admin/contact"),
      process.platform === "win32" ? "junction" : "dir",
    );
    const path = join(fixture, "src/modules/contact/module.json");
    const manifest = JSON.parse(await readFile(path, "utf8"));
    manifest.paths.push("src/app/(dashboard)/admin/contact");
    await writeFile(path, JSON.stringify(manifest));
    const result = run("module-remove.mts", "contact", "--dry-run");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Symlink in deletion path");
  } finally {
    await rm(outside, { recursive: true, force: true });
  }
});

test("resolves relative, re-exported and computed module imports", async () => {
  await put(
    "src/lib/relative.ts",
    'export { contact } from "../modules/contact/module";\n',
  );
  await put(
    "src/lib/computed.ts",
    'const name = "contact"; export const load = () => import(`../modules/${name}/module`);\n',
  );
  const result = run("check-boundaries.mts");
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("src/lib/relative.ts:1:");
  expect(result.stderr).toContain("src/lib/computed.ts:1:");
});

test("allows a declared module dependency", async () => {
  await put(
    "src/modules/admin/module.json",
    JSON.stringify({
      id: "admin",
      name: "Admin",
      description: "Admin",
      paths: ["src/modules/admin"],
      prismaFiles: [],
      packages: [],
      envKeys: [],
      dependsOn: [],
    }),
  );
  await put("src/modules/admin/module.ts", "export const admin = true;\n");
  const path = join(fixture, "src/modules/contact/module.json");
  const manifest = JSON.parse(await readFile(path, "utf8"));
  manifest.dependsOn = ["admin"];
  await writeFile(path, JSON.stringify(manifest));
  await put("src/modules/contact/use.ts", 'import "@/modules/admin/module";\n');
  expect(run("check-boundaries.mts").status).toBe(0);
});

test("removal sees references and package use outside src", async () => {
  await put(
    "tests/shared.ts",
    'export { contact } from "../src/modules/contact/module";\n',
  );
  await put("scripts/reconcile.mts", 'import "stripe";\n');
  const path = join(fixture, "src/modules/contact/module.json");
  const manifest = JSON.parse(await readFile(path, "utf8"));
  manifest.packages = ["stripe"];
  await writeFile(path, JSON.stringify(manifest));
  const preview = run("module-remove.mts", "contact", "--dry-run");
  expect(preview.status).toBe(0);
  expect(preview.stdout).toContain("tests/shared.ts:1:");
  expect(preview.stdout).not.toContain("Would uninstall stripe");
});

test("removal strips both registry marker lines", async () => {
  await put(
    "src/config/module-lifecycle.ts",
    [
      'import { onUserDelete } from "@/modules/contact/lifecycle"; // module:contact',
      "export const userDeleteHooks = [",
      "  onUserDelete, // module:contact",
      "];",
    ].join("\n"),
  );
  await put("node_modules/next/dist/bin/next", "process.exit(0);\n");
  const result = run("module-remove.mts", "contact");
  expect(result.status).toBe(0);
  expect(result.stdout).toContain("Deletion plan for contact");
  expect(
    await readFile(join(fixture, "src/config/modules.ts"), "utf8"),
  ).not.toContain("module:contact");
  expect(
    await readFile(join(fixture, "src/config/module-lifecycle.ts"), "utf8"),
  ).not.toContain("module:contact");
});
