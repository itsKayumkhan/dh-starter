import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import ts from "typescript";
import { z } from "zod";

const root = process.cwd();
const manifestSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  paths: z.array(z.string()),
});
type Manifest = z.infer<typeof manifestSchema>;
const modulesRoot = join(root, "src", "modules");
const sourceExtensions = /\.(?:[cm]?[jt]s|[jt]sx)$/;

function repoPath(path: string) {
  return relative(root, path).split(sep).join("/");
}

function containsPath(path: string, ownedPath: string) {
  const prefix = ownedPath.replaceAll("\\", "/").replace(/\/$/, "");
  return path === prefix || path.startsWith(`${prefix}/`);
}

async function readManifests() {
  const manifests = new Map<string, Manifest>();
  for (const entry of await readdir(modulesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = join(modulesRoot, entry.name, "module.json");
    const manifest = manifestSchema.parse(JSON.parse(await readFile(path, "utf8")));
    if (manifest.id !== entry.name)
      throw new Error(`${repoPath(path)}: manifest id does not match its directory`);
    manifests.set(manifest.id, manifest);
  }
  return manifests;
}

async function sourceFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(path));
    else if (entry.isFile() && sourceExtensions.test(entry.name)) files.push(path);
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

const manifests = await readManifests();
const files = (await Promise.all(["src", "tests", "scripts", "prisma"].map(async (dir) => {
  try { return await sourceFiles(resolve(root, dir)); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}))).flat();
const errors: string[] = [];

for (const path of files) {
  const fileName = repoPath(path);
  if (fileName === "src/config/modules.ts") continue;
  const source = ts.createSourceFile(fileName, await readFile(path, "utf8"), ts.ScriptTarget.Latest, true);
  for (const specifier of importedSpecifiers(source)) {
    const match = /^@\/modules\/([^/]+)(?:\/|$)/.exec(specifier.text);
    if (!match) continue;
    const id = match[1];
    const manifest = manifests.get(id);
    if (manifest && containsPath(fileName, "src/features")) continue;
    if (manifest && manifest.paths.some((ownedPath) => containsPath(fileName, ownedPath))) continue;
    const line = source.getLineAndCharacterOfPosition(specifier.getStart(source)).line + 1;
    const reason = manifest ? `this file is outside ${id}'s manifest paths` : `module ${id} has no manifest`;
    const hint = manifest
      ? `Move this file into a path owned by ${id}, or move shared code into core and import it there.`
      : `Remove the stale import or restore module ${id} and its manifest.`;
    errors.push(`${fileName}:${line}: ${specifier.text} is disallowed because ${reason}. Hint: ${hint}`);
  }
}

if (errors.length) {
  process.stderr.write(`Module boundary violations:\n${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Module boundaries passed (${manifests.size} modules, ${files.length} source files).\n`);
}
