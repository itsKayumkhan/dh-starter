import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  contentRegistry,
  type ContentKey,
  type ContentValue,
} from "@/config/content";
import { db } from "@/lib/db";
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

export async function getContent<K extends ContentKey>(
  key: K,
): Promise<ContentValue<K>> {
  "use cache";
  cacheLife("hours");
  cacheTag(`content:${key}`);
  try {
    const row = await db.contentBlock.findUnique({
      where: { key },
      select: { value: true },
    });
    return parseContent(key, row?.value);
  } catch (error) {
    logger.warn("Content block unavailable, using default", { key, error });
    return parseContent(key, null);
  }
}
