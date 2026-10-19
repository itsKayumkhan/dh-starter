import { z } from "zod";
import { ROUTES } from "@/lib/constants/routes";

const pathSchema = z.string().min(1).max(2048);
const base = "https://local.invalid";

export function sanitizeNext(value: unknown): string {
  const parsed = pathSchema.safeParse(value);
  if (!parsed.success) return ROUTES.dashboard;
  const raw = parsed.data;
  if (
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(raw)
  ) {
    return ROUTES.dashboard;
  }
  try {
    let decoded = raw;
    for (let index = 0; index < 3; index += 1) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
      if (decoded.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(decoded))
        return ROUTES.dashboard;
    }
    const url = new URL(raw, base);
    if (url.origin !== base) return ROUTES.dashboard;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return ROUTES.dashboard;
  }
}
