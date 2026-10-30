import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import {
  settingSchemas,
  settingsDefaults,
  type SiteSettings,
  type SettingKey,
} from "@/config/settings";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export function mergeSettings(
  rows: { key: string; value: unknown }[],
): SiteSettings {
  const result: SiteSettings = structuredClone(settingsDefaults);
  for (const row of rows) {
    if (!(row.key in settingSchemas)) continue;
    const key = row.key as SettingKey;
    const parsed = settingSchemas[key].safeParse(row.value);
    if (parsed.success) Object.assign(result, { [key]: parsed.data });
    else logger.warn("Ignoring invalid site setting", { key });
  }
  return result;
}

/** Short cache for the defaults served while the database is unreachable (also a build without one). */
export const FALLBACK_CACHE_LIFE = { stale: 300, revalidate: 60, expire: 300 };

export async function readSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag("site-settings");
  let rows: { key: string; value: unknown }[];
  try {
    rows = await db.siteSetting.findMany({
      select: { key: true, value: true },
    });
  } catch (error) {
    // A throw inside "use cache" fails the build even when the caller catches it, so the
    // defaults are returned here and retried after a minute instead of being kept for hours.
    cacheLife(FALLBACK_CACHE_LIFE);
    logger.warn("Site settings unavailable, using defaults", { error });
    return structuredClone(settingsDefaults);
  }
  cacheLife("hours");
  return mergeSettings(rows);
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    return await readSiteSettings();
  } catch (error) {
    unstable_rethrow(error);
    logger.warn("Site settings unavailable, using defaults", { error });
    return structuredClone(settingsDefaults);
  }
}
