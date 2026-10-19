import type { z } from "zod";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}
export function fail<T = never>(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return { ok: false, error, ...(fieldErrors ? { fieldErrors } : {}) };
}
export function fromZodError(error: z.ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.map(String).join(".") || "_form";
    (fields[path] ??= []).push(issue.message);
  }
  return fields;
}
