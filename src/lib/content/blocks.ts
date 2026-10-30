import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import {
  contentRegistry,
  type ContentKey,
  type ContentValue,
} from "@/config/content";
import { db } from "@/lib/db";
import { FALLBACK_CACHE_LIFE } from "@/lib/content/settings";
import { logger } from "@/lib/logger";

export function parseContent<K extends ContentKey>(
  key: K,
  value: unknown,
): ContentValue<K> {
  const block = contentRegistry[key];
  const parsed = block.schema.safeParse(value);
  if (parsed.success) return parsed.data as ContentValue<K>;
  if (value !== null && value !== undefined)
    logger.warn("Ignoring invalid content block", { key });
  return structuredClone(block.defaultValue) as ContentValue<K>;
}

export async function readContent<K extends ContentKey>(
  key: K,
): Promise<ContentValue<K>> {
  "use cache";
  cacheTag(`content:${key}`);
  let row: { value: unknown } | null;
  try {
    row = await db.contentBlock.findUnique({
      where: { key },
      select: { value: true },
    });
  } catch (error) {
    // Same as readSiteSettings: defaults for a minute while the database is unreachable.
    cacheLife(FALLBACK_CACHE_LIFE);
    logger.warn("Content block unavailable, using default", { key, error });
    return parseContent(key, null);
  }
  cacheLife("hours");
  return parseContent(key, row?.value);
}

export async function getContent<K extends ContentKey>(
  key: K,
): Promise<ContentValue<K>> {
  try {
    return await readContent(key);
  } catch (error) {
    unstable_rethrow(error);
    logger.warn("Content block unavailable, using default", { key, error });
    return parseContent(key, null);
  }
}
