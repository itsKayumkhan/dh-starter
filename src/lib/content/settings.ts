import "server-only";
import { cacheLife, cacheTag } from "next/cache";
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

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag("site-settings");
  try {
    return mergeSettings(
      await db.siteSetting.findMany({ select: { key: true, value: true } }),
    );
  } catch (error) {
    logger.warn("Site settings unavailable, using defaults", { error });
    return structuredClone(settingsDefaults);
  }
}
