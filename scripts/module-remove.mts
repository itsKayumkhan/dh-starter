import { lstat, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve, relative, join, sep, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { z } from "zod";
import {
  containsPath,
  importedModuleId,
  importedSpecifiers,
  moduleIdPattern,
  projectSources,
  readSource,
  repoPath,
  root,
} from "./module-imports.mjs";

// npm names use lowercase URL-safe segments. Shell syntax, options and versions are not package names.
const packageNamePattern =
  /^(?:@[a-z0-9][a-z0-9._~-]*\/[a-z0-9][a-z0-9._~-]*|[a-z0-9][a-z0-9._~-]*)$/;

const manifestSchema = z.object({
  id: z.string().regex(moduleIdPattern),
  name: z.string(),
  description: z.string(),
  paths: z.array(z.string()),
  prismaFiles: z.array(z.string()),
  packages: z.array(z.string().max(214).regex(packageNamePattern)),
  envKeys: z.array(z.string()),
  dependsOn: z.array(z.string()),
});
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const id = z
  .string()
  .regex(moduleIdPattern)
  .parse(args.find((arg) => !arg.startsWith("--")));
const moduleDir = resolve(root, "src/modules", id);
let manifestRaw: string;
try {
  manifestRaw = await readFile(join(moduleDir, "module.json"), "utf8");
} catch {
  process.stderr
    .write(`Module "${id}" is not installed. Run npm run module:list to see installed modules.
`);
  process.exit(1);
}
const manifest = manifestSchema.parse(JSON.parse(manifestRaw));
if (manifest.id !== id) throw new Error("Manifest ID does not match directory");
if (!manifest.paths.includes(`src/modules/${id}`))
  throw new Error("Manifest must own its module directory");
const modulesRoot = resolve(root, "src/modules");
for (const other of await readdir(modulesRoot)) {
  if (other === id) continue;
  let contents: string;
  try {
    contents = await readFile(join(modulesRoot, other, "module.json"), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
    throw error;
  }
  const candidate = manifestSchema.parse(JSON.parse(contents));
  if (candidate.dependsOn.includes(id))
    throw new Error(`${other} depends on ${id}`);
}
const legacyRoutes: Record<string, string[]> = {
  admin: ["src/app/(dashboard)/admin/users", "src/app/(dashboard)/admin/audit"],
  billing: ["src/app/(marketing)/pricing"],
  contact: ["src/app/(dashboard)/admin/inquiries"],
  uploads: ["src/app/(dashboard)/admin/media"],
};

function checkedPath(path: string) {
  const full = resolve(root, path);
  const rel = relative(root, full).replaceAll("\\", "/");
  const appRoutes = [
    `src/app/api/${id}`,
    `src/app/(dashboard)/dashboard/${id}`,
    `src/app/(dashboard)/admin/${id}`,
    `src/app/(marketing)/${id}`,
    ...(legacyRoutes[id] ?? []),
  ];
  const allowed =
    rel === `src/modules/${id}` ||
    appRoutes.includes(rel) ||
    rel === `prisma/schema/${id}.prisma` ||
    rel === `tests/e2e/${id}.spec.ts`;
  if (!allowed || rel.startsWith("../") || resolve(root, rel) !== full)
    throw new Error(`Unsafe path: ${path}`);
  return full;
}
const targets = [...manifest.paths, ...manifest.prismaFiles].map((path) => ({
  path,
  full: checkedPath(path),
}));
if (new Set(targets.map((target) => target.full)).size !== targets.length)
  throw new Error("Manifest contains duplicate deletion paths");
async function inspectTarget(full: string): Promise<string[]> {
  const parts: string[] = [];
  let current = full;
  while (current !== root) {
    parts.push(current);
    current = dirname(current);
    if (!current.startsWith(`${root}${sep}`) && current !== root)
      throw new Error(`Path leaves repository: ${full}`);
  }
  for (const part of parts.reverse()) {
    let stat;
    try {
      stat = await lstat(part);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
    if (stat.isSymbolicLink())
      throw new Error(`Symlink in deletion path: ${repoPath(part)}`);
  }
  const stat = await lstat(full);
  if (!stat.isDirectory()) return [repoPath(full)];
  const files: string[] = [];
  for (const entry of await readdir(full)) {
    files.push(...(await inspectTarget(join(full, entry))));
  }
  return files;
}
const deletionFiles = (
  await Promise.all(targets.map(({ full }) => inspectTarget(full)))
).flat();
const remainingFiles = (await projectSources()).filter(
  (path) =>
    !targets.some((target) =>
      containsPath(repoPath(path), repoPath(target.full)),
    ),
);
const references: string[] = [];
const usedPackages = new Set<string>();
for (const path of remainingFiles) {
  const fileName = repoPath(path);
  if (
    ["src/config/modules.ts", "src/config/module-lifecycle.ts"].includes(
      fileName,
    )
  )
    continue;
  const source = await readSource(path);
  for (const reference of importedSpecifiers(source)) {
    const line =
      source.getLineAndCharacterOfPosition(reference.position).line + 1;
    if (reference.computed) {
      if (reference.specifier.includes("modules"))
        references.push(`${fileName}:${line}: computed ${reference.specifier}`);
      for (const pkg of manifest.packages) usedPackages.add(pkg);
      continue;
    }
    if (importedModuleId(reference.specifier, path) === id)
      references.push(`${fileName}:${line}: ${reference.specifier}`);
    for (const pkg of manifest.packages)
      if (
        reference.specifier === pkg ||
        reference.specifier.startsWith(`${pkg}/`)
      )
        usedPackages.add(pkg);
  }
}
for (const other of await readdir(modulesRoot)) {
  if (other === id) continue;
  try {
    const otherManifest = manifestSchema.parse(
      JSON.parse(
        await readFile(join(modulesRoot, other, "module.json"), "utf8"),
      ),
    );
    for (const pkg of otherManifest.packages) usedPackages.add(pkg);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
const packagesToUninstall = manifest.packages.filter(
  (pkg) => !usedPackages.has(pkg),
);
const npmCli = process.env.npm_execpath;
if (!dryRun && packagesToUninstall.length && !npmCli)
  throw new Error(
    "npm_execpath is missing; run module removal through npm run module:remove",
  );
if (references.length) {
  const output = `References to ${id} outside its manifest paths:\n${references.join("\n")}\n`;
  if (dryRun || force) process.stdout.write(output);
  else {
    process.stderr.write(
      `${output}Removal stopped. Pass --force to remove the module anyway.\n`,
    );
    process.exit(1);
  }
}
const registries = new Map<string, string>();
for (const path of [
  "src/config/modules.ts",
  "src/config/module-lifecycle.ts",
]) {
  const full = resolve(root, path);
  try {
    const original = await readFile(full, "utf8");
    registries.set(
      full,
      original
        .split(/\r?\n/)
        .filter((line) => !line.trimEnd().endsWith(`// module:${id}`))
        .join("\n"),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
const envPath = resolve(root, ".env.example");
const env = await readFile(envPath, "utf8");
const envLines = env.split(/\r?\n/);
const isRemovedKey = (line: string) =>
  manifest.envKeys.some((key) => line.startsWith(`${key}=`));
const nextEnv = envLines
  .filter((line, index) => {
    if (isRemovedKey(line)) return false;
    // section header written for this module, e.g. "# --- billing module (Stripe) ---"
    if (line.startsWith(`# --- ${id} module`)) return false;
    // the comment line directly above a removed key
    const nextLine = envLines[index + 1];
    return !(
      line.startsWith("#") &&
      nextLine !== undefined &&
      isRemovedKey(nextLine)
    );
  })
  .join("\n")
  .replace(/\n{3,}/g, "\n\n");
process.stdout.write(
  `Deletion plan for ${id}:\n${deletionFiles.map((file) => `  ${file}`).join("\n")}\n`,
);
for (const { path } of targets)
  process.stdout.write(`${dryRun ? "Would delete" : "Deleting"} ${path}\n`);
if (!dryRun) {
  for (const { full } of targets) await inspectTarget(full);
  for (const { full } of targets)
    await rm(full, { recursive: true, force: true });
  for (const [path, content] of registries) await writeFile(path, content);
  await writeFile(envPath, nextEnv);
}
for (const pkg of packagesToUninstall) {
  process.stdout.write(
    `${dryRun ? "Would uninstall" : "Uninstalling"} ${pkg}\n`,
  );
  if (!dryRun) {
    // Node 24 cannot spawn npm.cmd with shell:false on Windows. npm_execpath is npm's JS CLI.
    const result = spawnSync(
      process.execPath,
      [npmCli as string, "uninstall", "--", pkg],
      {
        cwd: root,
        stdio: "inherit",
        shell: false,
      },
    );
    if (result.error || result.status !== 0)
      throw new Error(`npm uninstall failed for ${pkg}`);
  }
}
if (!dryRun) {
  // Regenerate route types (LayoutProps, PageProps) for the remaining routes.
  const result = spawnSync(
    process.execPath,
    [resolve(root, "node_modules/next/dist/bin/next"), "typegen"],
    { cwd: root, stdio: "inherit", shell: false },
  );
  if (result.error || result.status !== 0)
    throw new Error("next typegen failed");
}
process.stdout.write(
  manifest.prismaFiles.length
    ? `Next steps:\n  1. npx prisma migrate dev --name remove_${id}   (drops this module tables)\n  2. npm run typecheck && npm run build\n`
    : "Next steps:\n  1. npm run typecheck && npm run build\n",
);
