// Every module ships tested: each logic file is imported (not only mocked) by a unit test in the
// same module, and the module has a browser test at tests/e2e/<id>.spec.ts. A file that holds only
// types or one-line wiring opts out with a first-line comment: // test-exempt: <reason>
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import ts from "typescript";
import {
  readSource,
  repoPath,
  resolveImport,
  root,
  sourceFiles,
} from "./module-imports.mjs";

const modulesRoot = join(root, "src", "modules");
const testFile = /\.test\.[cm]?[jt]sx?$/;
// Declarative files: registry entries, route maps, lazy env readers and display components are
// covered by the type checker, the e2e spec and the component tests of the forms that use them.
const declarative =
  /\/(?:module|routes|env|messages|format)\.ts$|\/components\/(?!.*form).*\.tsx$|\/emails\//;

/** Static and dynamic imports only: vi.mock("x") stubs a file, it does not test it. */
function realImports(file: ts.SourceFile) {
  const specifiers: string[] = [];
  function visit(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier) &&
      !(ts.isImportDeclaration(node) && node.importClause?.isTypeOnly)
    )
      specifiers.push(node.moduleSpecifier.text);
    else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    )
      specifiers.push(node.arguments[0].text);
    ts.forEachChild(node, visit);
  }
  visit(file);
  return specifiers;
}

const errors: string[] = [];
let checked = 0;
const ids = (await readdir(modulesRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

for (const id of ids) {
  if (!existsSync(join(root, "tests", "e2e", `${id}.spec.ts`)))
    errors.push(`src/modules/${id}: missing tests/e2e/${id}.spec.ts`);

  const files = await sourceFiles(join(modulesRoot, id));
  const tested = new Set<string>();
  for (const path of files.filter((file) => testFile.test(file))) {
    for (const specifier of realImports(await readSource(path))) {
      const resolved = resolveImport(specifier, path);
      if (resolved) tested.add(resolved);
    }
  }

  for (const path of files) {
    const name = repoPath(path);
    if (testFile.test(name) || declarative.test(name)) continue;
    const firstLine = (await readFile(path, "utf8")).split(/\r?\n/, 1)[0];
    if (/^\/\/ test-exempt: \S/.test(firstLine)) continue;
    checked += 1;
    if (!tested.has(name))
      errors.push(`${name}: no unit test in src/modules/${id} imports it`);
  }
}

if (errors.length) {
  process.stderr.write(`Untested module code:\n${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Module tests passed (${ids.length} modules, ${checked} logic files covered).\n`,
  );
}
