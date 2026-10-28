import { createHash } from "node:crypto";

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}

export function settingsRevision(
  rows: { key: string; updatedAt: Date; value?: unknown }[],
) {
  const ordered = rows
    .map(({ key, updatedAt, value }): [string, string, unknown] => [
      key,
      updatedAt.toISOString(),
      canonical(value),
    ])
    .sort(([a], [b]) => a.localeCompare(b));
  return createHash("sha256").update(JSON.stringify(ordered)).digest("hex");
}

export function blockRevision(row: { updatedAt: Date; value: unknown } | null) {
  if (!row) return null;
  return createHash("sha256")
    .update(JSON.stringify([row.updatedAt.toISOString(), canonical(row.value)]))
    .digest("hex");
}
