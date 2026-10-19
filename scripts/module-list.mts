import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

const manifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  paths: z.array(z.string()),
  prismaFiles: z.array(z.string()),
  packages: z.array(z.string()),
  envKeys: z.array(z.string()),
  dependsOn: z.array(z.string()),
});

const root = join(process.cwd(), "src/modules");
let entries: string[] = [];
try {
  entries = await readdir(root);
} catch {
  /* No modules installed. */
}
let count = 0;
for (const id of entries) {
  let contents: string;
  try {
    contents = await readFile(join(root, id, "module.json"), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
    throw error;
  }
  const manifest = manifestSchema.parse(JSON.parse(contents));
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
  count++;
}
if (count === 0) process.stdout.write("No modules installed.\n");
