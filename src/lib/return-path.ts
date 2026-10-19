import { z } from "zod";
import { ROUTES } from "@/lib/constants/routes";

const returnPathSchema = z.string().max(2048);

export function safeReturnPath(
  value: unknown,
  fallback: string = ROUTES.dashboard,
): string {
  const parsed = returnPathSchema.safeParse(value);
  if (!parsed.success) return fallback;
  const path = parsed.data;
  if (!path.startsWith("/") || path.startsWith("//") || /[\\\r\n\0]/.test(path))
    return fallback;
  return path;
}
