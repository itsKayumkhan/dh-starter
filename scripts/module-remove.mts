import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve, relative, join, sep } from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";
import { z } from "zod";

const manifestSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string(),
  description: z.string(),
  paths: z.array(z.string()),
  prismaFiles: z.array(z.string()),
  packages: z.array(z.string()),
  envKeys: z.array(z.string()),
  dependsOn: z.array(z.string()),
});
const root = process.cwd();
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const id = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/)
  .parse(args.find((arg) => !arg.startsWith("--")));
const moduleDir = resolve(root, "src/modules", id);
let manifestRaw: string;
try {
  manifestRaw = await readFile(join(moduleDir, "module.json"), "utf8");
} catch {
  process.stderr.write(`Module "${id}" is not installed. Run npm run module:list to see installed modules.
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
function checkedPath(path: string) {
  const full = resolve(root, path);
  const rel = relative(root, full).replaceAll("\\", "/");
  const allowed =
    rel === `src/modules/${id}` ||
    (rel.startsWith("src/app/") && rel.split("/").length >= 4) ||
    rel === `prisma/schema/${id}.prisma` ||
    /^tests\/e2e\/[a-z0-9-]+\.spec\.ts$/.test(rel);
  if (!allowed || rel.startsWith("../") || resolve(root, rel) !== full)
    throw new Error(`Unsafe path: ${path}`);
  return full;
}
const targets = [...manifest.paths, ...manifest.prismaFiles].map((path) => ({
  path,
  full: checkedPath(path),
}));
function repoPath(path: string) {
  return relative(root, path).split(sep).join("/");
}
function containsPath(path: string, ownedPath: string) {
  const prefix = ownedPath.replaceAll("\\", "/").replace(/\/$/, "");
  return path === prefix || path.startsWith(`${prefix}/`);
}
async function sourceFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(path));
    else if (entry.isFile() && /\.[cm]?[jt]sx?$/.test(entry.name)) files.push(path);
  }
  return files;
}
function importedSpecifiers(file: ts.SourceFile) {
  const imports: ts.StringLiteralLike[] = [];
  function visit(node: ts.Node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
      imports.push(node.moduleSpecifier);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteralLike(node.argument.literal)) {
      imports.push(node.argument.literal);
    } else if (ts.isImportEqualsDeclaration(node) &&
        ts.isExternalModuleReference(node.moduleReference) &&
        node.moduleReference.expression && ts.isStringLiteralLike(node.moduleReference.expression)) {
      imports.push(node.moduleReference.expression);
    } else if (ts.isCallExpression(node) && node.arguments.length > 0 &&
        ts.isStringLiteralLike(node.arguments[0])) {
      const callee = node.expression;
      const isImport = callee.kind === ts.SyntaxKind.ImportKeyword;
      const isLoader = ts.isIdentifier(callee) && callee.text === "require";
      const isMock = ts.isPropertyAccessExpression(callee) &&
        ["mock", "doMock", "importActual", "importMock"].includes(callee.name.text);
      if (isImport || isLoader || isMock) imports.push(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return imports;
}
const references: string[] = [];
for (const path of await sourceFiles(resolve(root, "src"))) {
  const fileName = repoPath(path);
  if (fileName === "src/config/modules.ts" ||
      manifest.paths.some((ownedPath) => containsPath(fileName, ownedPath))) continue;
  const source = ts.createSourceFile(fileName, await readFile(path, "utf8"), ts.ScriptTarget.Latest, true);
  for (const specifier of importedSpecifiers(source)) {
    if (specifier.text !== `@/modules/${id}` &&
        !specifier.text.startsWith(`@/modules/${id}/`)) continue;
    const line = source.getLineAndCharacterOfPosition(specifier.getStart(source)).line + 1;
    references.push(`${fileName}:${line}: ${specifier.text}`);
  }
}
if (references.length) {
  const output = `References to ${id} outside its manifest paths:\n${references.join("\n")}\n`;
  if (dryRun || force) process.stdout.write(output);
  else {
    process.stderr.write(`${output}Removal stopped. Pass --force to remove the module anyway.\n`);
    process.exit(1);
  }
}
const registryPath = resolve(root, "src/config/modules.ts");
const registry = await readFile(registryPath, "utf8");
const nextRegistry = registry
  .split(/\r?\n/)
  .filter((line) => !line.trimEnd().endsWith(`// module:${id}`))
  .join("\n");
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
    return !(line.startsWith("#") && nextLine !== undefined && isRemovedKey(nextLine));
  })
  .join("\n")
  .replace(/\n{3,}/g, "\n\n");
for (const { path, full } of targets) {
  process.stdout.write(`${dryRun ? "Would delete" : "Deleting"} ${path}\n`);
  if (!dryRun) await rm(full, { recursive: true, force: true });
}
if (!dryRun) {
  await writeFile(registryPath, nextRegistry);
  await writeFile(envPath, nextEnv);
}
for (const pkg of manifest.packages) {
  const files = async (dir: string): Promise<string[]> => {
    const items = await readdir(dir, { withFileTypes: true });
    return (
      await Promise.all(
        items.map(async (item) =>
          item.isDirectory()
            ? files(join(dir, item.name))
            : [join(dir, item.name)],
        ),
      )
    ).flat();
  };
  const removed = [...manifest.paths, ...manifest.prismaFiles].map(checkedPath);
  const sourceFiles = (await files(resolve(root, "src"))).filter(
    (file) =>
      /\.[cm]?[jt]sx?$/.test(file) &&
      !removed.some(
        (path) =>
          file === path ||
          file.startsWith(`${path}\\`) ||
          file.startsWith(`${path}/`),
      ),
  );
  const used = (
    await Promise.all(
      sourceFiles.map(async (file) => {
        const source = await readFile(file, "utf8");
        return [
          `from "${pkg}`,
          `from '${pkg}`,
          `import("${pkg}`,
          `import('${pkg}`,
          `import "${pkg}`,
          `import '${pkg}`,
          `require("${pkg}`,
          `require('${pkg}`,
        ].some((prefix) => source.includes(prefix));
      }),
    )
  ).some(Boolean);
  if (!used) {
    process.stdout.write(
      `${dryRun ? "Would uninstall" : "Uninstalling"} ${pkg}\n`,
    );
    if (!dryRun) {
      const result = spawnSync("npm", ["uninstall", pkg], {
        cwd: root,
        stdio: "inherit",
        shell: true,
      });
      if (result.status !== 0)
        throw new Error(`npm uninstall failed for ${pkg}`);
    }
  }
}
if (!dryRun) {
  // Generated route types still point at deleted pages until the next build.
  await rm(resolve(root, ".next"), { recursive: true, force: true });
  // Regenerate route types (LayoutProps, PageProps) for the remaining routes.
  spawnSync("npx", ["next", "typegen"], { cwd: root, stdio: "inherit", shell: true });
}
process.stdout.write(
  manifest.prismaFiles.length
    ? `Next steps:\n  1. npx prisma migrate dev --name remove_${id}   (drops this module tables)\n  2. npm run typecheck && npm run build\n`
    : "Next steps:\n  1. npm run typecheck && npm run build\n",
);
