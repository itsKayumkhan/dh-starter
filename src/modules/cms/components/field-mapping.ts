import type { ContentField } from "@/config/content";

export function fieldsForItem(
  fields: readonly ContentField[],
  prefix = "",
): { path: string; field: ContentField }[] {
  return fields.flatMap((field) => {
    const path = prefix ? `${prefix}.${field.name}` : field.name;
    return field.type === "list" ? [] : [{ path, field }];
  });
}

export function emptyItem(
  fields: readonly ContentField[],
): Record<string, string | boolean> {
  return Object.fromEntries(
    fields.map((field) => [field.name, field.type === "boolean" ? false : ""]),
  );
}

export function moveItem<T>(
  items: readonly T[],
  index: number,
  direction: -1 | 1,
): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return [...items];
  const result = [...items];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}
