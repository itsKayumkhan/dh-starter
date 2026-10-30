import { describe, expect, it, vi, beforeEach } from "vitest";
import { site } from "@/config/site";
import { contentRegistry } from "@/config/content";

const { cacheLife, findMany, findUnique, warn } = vi.hoisted(() => ({
  cacheLife: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  warn: vi.fn(),
}));
vi.mock("next/cache", () => ({ cacheLife, cacheTag: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: { siteSetting: { findMany }, contentBlock: { findUnique } },
}));
vi.mock("@/lib/logger", () => ({ logger: { warn } }));

import {
  FALLBACK_CACHE_LIFE,
  getSiteSettings,
  mergeSettings,
  readSiteSettings,
} from "@/lib/content/settings";
import { getContent, parseContent, readContent } from "@/lib/content/blocks";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("site settings", () => {
  it("uses valid database rows over defaults and keeps missing defaults", () => {
    const result = mergeSettings([
      { key: "name", value: "New Brand" },
      { key: "supportEmail", value: "hello@example.com" },
    ]);
    expect(result.name).toBe("New Brand");
    expect(result.supportEmail).toBe("hello@example.com");
    expect(result.address).toBe(site.address);
  });
  it("ignores invalid rows with a warning", () => {
    expect(
      mergeSettings([{ key: "url", value: "javascript:alert(1)" }]).url,
    ).toBe(site.url);
    expect(warn).toHaveBeenCalledWith("Ignoring invalid site setting", {
      key: "url",
    });
  });
  it("uses defaults when the database is offline", async () => {
    findMany.mockRejectedValue(new Error("offline"));
    expect((await getSiteSettings()).name).toBe(site.name);
  });
  it("caches stored settings for hours", async () => {
    findMany.mockResolvedValueOnce([{ key: "name", value: "Stored" }]);
    expect((await readSiteSettings()).name).toBe("Stored");
    expect(cacheLife).toHaveBeenCalledExactlyOnceWith("hours");
  });
  it("keeps the settings fallback for one minute only, without throwing (a build without a database passes)", async () => {
    findMany.mockRejectedValueOnce(new Error("offline"));
    expect((await readSiteSettings()).name).toBe(site.name);
    expect(cacheLife).toHaveBeenCalledExactlyOnceWith(FALLBACK_CACHE_LIFE);
    expect(FALLBACK_CACHE_LIFE.revalidate).toBeLessThanOrEqual(60);
  });
  it("returns stored settings immediately after an outage recovers", async () => {
    findMany
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce([{ key: "name", value: "Recovered" }]);
    expect((await getSiteSettings()).name).toBe(site.name);
    expect((await getSiteSettings()).name).toBe("Recovered");
  });
});

describe("content blocks", () => {
  it("uses the registry default for missing rows", async () => {
    findUnique.mockResolvedValue(null);
    expect(await getContent("home.hero")).toEqual(
      contentRegistry["home.hero"].defaultValue,
    );
  });
  it("parses a valid stored block", async () => {
    const value = {
      ...contentRegistry["home.hero"].defaultValue,
      title: "Edited title",
    };
    findUnique.mockResolvedValue({ value });
    expect((await getContent("home.hero")).title).toBe("Edited title");
  });
  it("ignores malformed values and survives an offline database", async () => {
    expect(parseContent("home.hero", { title: 7 })).toEqual(
      contentRegistry["home.hero"].defaultValue,
    );
    findUnique.mockRejectedValue(new Error("offline"));
    expect(await getContent("home.hero")).toEqual(
      contentRegistry["home.hero"].defaultValue,
    );
  });
  it("keeps the content fallback for one minute only, without throwing", async () => {
    findUnique.mockRejectedValueOnce(new Error("offline"));
    expect(await readContent("home.hero")).toEqual(
      contentRegistry["home.hero"].defaultValue,
    );
    expect(cacheLife).toHaveBeenCalledExactlyOnceWith(FALLBACK_CACHE_LIFE);
  });
  it("returns stored content immediately after an outage recovers", async () => {
    findUnique
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        value: {
          ...contentRegistry["home.hero"].defaultValue,
          title: "Recovered title",
        },
      });
    expect((await getContent("home.hero")).title).toBe(
      contentRegistry["home.hero"].defaultValue.title,
    );
    expect((await getContent("home.hero")).title).toBe("Recovered title");
  });
});
