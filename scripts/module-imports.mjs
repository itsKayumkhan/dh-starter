import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import ts from "typescript";

export const root = process.cwd();
export const sourceExtensions = /\.(?:[cm]?[jt]s|[jt]sx)$/;
export const moduleIdPattern = /^[a-z][a-z0-9-]*$/;

/** @param {string} path */
export function repoPath(path) {
  return relative(root, path).split(sep).join("/");
}

/** @param {string} path @param {string} ownedPath */
export function containsPath(path, ownedPath) {
  return path === ownedPath || path.startsWith(`${ownedPath}/`);
}

/** @param {string} dir @returns {Promise<string[]>} */
export async function sourceFiles(dir) {
  /** @type {string[]} */
  const files = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return files;
    throw error;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(path)));
    else if (entry.isFile() && sourceExtensions.test(entry.name))
      files.push(path);
  }
  return files;
}

/** @typedef {{ specifier: string, position: number, computed: boolean }} ImportReference */

/** @param {import("typescript").SourceFile} file @returns {ImportReference[]} */
export function importedSpecifiers(file) {
  /** @type {ImportReference[]} */
  const imports = [];
  /** @param {import("typescript").StringLiteralLike} node */
  function add(node) {
    imports.push({
      specifier: node.text,
      position: node.getStart(file),
      computed: false,
    });
  }
  /** @param {import("typescript").Node} node */
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    )
      add(node.moduleSpecifier);
    else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteralLike(node.argument.literal)
    )
      add(node.argument.literal);
    else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteralLike(node.moduleReference.expression)
    )
      add(node.moduleReference.expression);
    else if (ts.isCallExpression(node) && node.arguments.length > 0) {
      const callee = node.expression;
      const isImport = callee.kind === ts.SyntaxKind.ImportKeyword;
      const isLoader = ts.isIdentifier(callee) && callee.text === "require";
      const isMock =
        ts.isPropertyAccessExpression(callee) &&
        ["mock", "doMock", "importActual", "importMock"].includes(
          callee.name.text,
        );
      if (isImport || isLoader || isMock) {
        const arg = node.arguments[0];
        if (ts.isStringLiteralLike(arg)) add(arg);
        else if (isImport || isLoader)
          imports.push({
            specifier: arg.getText(file),
            position: arg.getStart(file),
            computed: true,
          });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return imports;
}

/** @type {import("typescript").CompilerOptions} */
const compilerOptions = {
  baseUrl: root,
  paths: { "@/*": [resolve(root, "src/*")] },
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  allowJs: true,
  resolveJsonModule: true,
};

/** @param {string} specifier @param {string} importer @returns {string | null} */
export function resolveImport(specifier, importer) {
  const resolved = ts.resolveModuleName(
    specifier,
    importer,
    compilerOptions,
    ts.sys,
  ).resolvedModule;
  return resolved ? repoPath(resolved.resolvedFileName) : null;
}

/** @param {string} specifier @param {string} importer @returns {string | null} */
export function importedModuleId(specifier, importer) {
  const resolved = resolveImport(specifier, importer);
  const path =
    resolved ??
    (specifier.startsWith("@/modules/")
      ? specifier.replace(/^@\//, "src/")
      : specifier.startsWith(".")
        ? repoPath(resolve(join(importer, ".."), specifier))
        : "");
  return /^src\/modules\/([^/]+)(?:\/|$)/.exec(path)?.[1] ?? null;
}

export async function projectSources() {
  return (
    await Promise.all(
      ["src", "tests", "scripts", "prisma"].map((dir) =>
        sourceFiles(resolve(root, dir)),
      ),
    )
  ).flat();
}

/** @param {string} path */
export async function readSource(path) {
  return ts.createSourceFile(
    repoPath(path),
    await readFile(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
}
