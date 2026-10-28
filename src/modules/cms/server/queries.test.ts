import { describe, expect, it, vi } from "vitest";
import { settingsDefaults } from "@/config/settings";

const { findMany, userFindMany, cachedSettings } = vi.hoisted(() => ({
  findMany: vi.fn(),
  userFindMany: vi.fn(),
  cachedSettings: vi.fn(),
}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: { siteSetting: { findMany }, user: { findMany: userFindMany } },
}));
vi.mock("@/lib/content/settings", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/content/settings")>();
  return { ...original, getSiteSettings: cachedSettings };
});
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn() } }));
import { getSettingsEditorData } from "@/modules/cms/server/queries";

describe("settings editor data", () => {
  it("uses fresh rows instead of a cached outage fallback", async () => {
    cachedSettings.mockResolvedValue(settingsDefaults);
    findMany.mockResolvedValue([
      {
        key: "name",
        value: "Live Brand",
        updatedAt: new Date("2026-10-28T00:00:00Z"),
        updatedBy: null,
      },
    ]);
    const result = await getSettingsEditorData();
    expect(result.value.name).toBe("Live Brand");
    expect(cachedSettings).not.toHaveBeenCalled();
  });
  it("does not return an editable fallback when the database is unavailable", async () => {
    findMany.mockRejectedValueOnce(new Error("offline"));
    await expect(getSettingsEditorData()).rejects.toThrow("offline");
  });
});
