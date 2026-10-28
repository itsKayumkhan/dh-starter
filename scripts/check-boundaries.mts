import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
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

const manifestSchema = z.object({
  id: z.string().regex(moduleIdPattern),
  paths: z.array(z.string()),
  dependsOn: z.array(z.string().regex(moduleIdPattern)),
});
type Manifest = z.infer<typeof manifestSchema>;
const manifests = new Map<string, Manifest>();
const modulesRoot = join(root, "src", "modules");

for (const entry of await readdir(modulesRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const path = join(modulesRoot, entry.name, "module.json");
  const manifest = manifestSchema.parse(
    JSON.parse(await readFile(path, "utf8")),
  );
  if (manifest.id !== entry.name)
    throw new Error(
      `${repoPath(path)}: manifest id does not match its directory`,
    );
  manifests.set(manifest.id, manifest);
}

const files = await projectSources();
const errors: string[] = [];
for (const path of files) {
  const fileName = repoPath(path);
  if (
    ["src/config/modules.ts", "src/config/module-lifecycle.ts"].includes(
      fileName,
    )
  )
    continue;
  const source = await readSource(path);
  const owner = [...manifests.values()].find((manifest) =>
    manifest.paths.some((ownedPath) => containsPath(fileName, ownedPath)),
  );
  for (const reference of importedSpecifiers(source)) {
    const line =
      source.getLineAndCharacterOfPosition(reference.position).line + 1;
    if (reference.computed) {
      if (
        !containsPath(fileName, "src/features") &&
        !/\.test\.[cm]?[jt]sx?$/.test(fileName)
      )
        errors.push(
          `${fileName}:${line}: computed import cannot be checked in core`,
        );
      continue;
    }
    const id = importedModuleId(reference.specifier, path);
    if (!id) continue;
    const target = manifests.get(id);
    if (
      target &&
      (owner?.id === id ||
        owner?.dependsOn.includes(id) ||
        containsPath(fileName, "src/features"))
    )
      continue;
    const reason = target
      ? `importer does not own or depend on ${id}`
      : `module ${id} has no manifest`;
    errors.push(
      `${fileName}:${line}: ${reference.specifier} is disallowed: ${reason}`,
    );
  }
}

if (errors.length) {
  process.stderr.write(`Module boundary violations:\n${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Module boundaries passed (${manifests.size} modules, ${files.length} source files).\n`,
  );
}
