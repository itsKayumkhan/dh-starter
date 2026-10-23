import { beforeEach, describe, expect, it, vi } from "vitest";
import { contentRegistry } from "@/config/content";
import { settingsDefaults } from "@/config/settings";
import { can } from "@/lib/auth/permissions";
import { ForbiddenError } from "@/lib/errors";

const {
  assertPermission,
  getClientIp,
  assertRateLimit,
  updateTag,
  transaction,
  settingsRows,
  settingUpsert,
  settingDelete,
  blockRow,
  blockUpsert,
  blockDelete,
  auditCreate,
} = vi.hoisted(() => ({
  assertPermission: vi.fn(),
  getClientIp: vi.fn(),
  assertRateLimit: vi.fn(),
  updateTag: vi.fn(),
  transaction: vi.fn(),
  settingsRows: vi.fn(),
  settingUpsert: vi.fn(),
  settingDelete: vi.fn(),
  blockRow: vi.fn(),
  blockUpsert: vi.fn(),
  blockDelete: vi.fn(),
  auditCreate: vi.fn(),
}));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("next/cache", () => ({ updateTag }));
vi.mock("@/lib/auth/session", () => ({
  assertPermission,
  assertUser: vi.fn(),
}));
vi.mock("@/lib/request", () => ({ getClientIp }));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/db", () => ({ db: { $transaction: transaction } }));

import {
  resetBlock,
  saveBlock,
  saveSettings,
} from "@/modules/cms/server/actions";

beforeEach(() => {
  vi.clearAllMocks();
  assertPermission.mockRejectedValue(new ForbiddenError());
  getClientIp.mockResolvedValue("127.0.0.1");
  settingsRows.mockResolvedValue([]);
  blockRow.mockResolvedValue(null);
  settingUpsert.mockResolvedValue({});
  settingDelete.mockResolvedValue({ count: 1 });
  blockUpsert.mockResolvedValue({});
  blockDelete.mockResolvedValue({ count: 1 });
  auditCreate.mockResolvedValue({});
  transaction.mockImplementation(
    async (handler: (tx: unknown) => Promise<unknown>) =>
      handler({
        siteSetting: {
          findMany: settingsRows,
          upsert: settingUpsert,
          deleteMany: settingDelete,
        },
        contentBlock: {
          findUnique: blockRow,
          upsert: blockUpsert,
          deleteMany: blockDelete,
        },
        auditLog: { create: auditCreate },
      }),
  );
});

describe("CMS action permissions", () => {
  it("checks settings permission before touching the database", async () => {
    const result = await saveSettings(settingsDefaults);
    expect(result.ok).toBe(false);
    expect(assertPermission).toHaveBeenCalledWith("settings:write");
    expect(transaction).not.toHaveBeenCalled();
  });
  it("checks content permission for save and reset", async () => {
    const key = "home.hero";
    const saved = await saveBlock({
      key,
      value: contentRegistry[key].defaultValue,
    });
    const reset = await resetBlock({ key });
    expect(saved.ok).toBe(false);
    expect(reset.ok).toBe(false);
    expect(assertPermission).toHaveBeenNthCalledWith(1, "content:write");
    expect(assertPermission).toHaveBeenNthCalledWith(2, "content:write");
    expect(transaction).not.toHaveBeenCalled();
  });
  it("writes settings and audit together before invalidating the settings tag", async () => {
    assertPermission.mockResolvedValue({ id: "admin-1", role: "admin" });
    const result = await saveSettings({
      ...settingsDefaults,
      name: "Edited Brand",
    });
    expect(result).toEqual({ ok: true, data: { changedKeys: ["name"] } });
    expect(settingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { key: "name" } }),
    );
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          meta: expect.objectContaining({
            changedKeys: ["name"],
            before: { name: settingsDefaults.name },
            after: { name: "Edited Brand" },
          }),
        }),
      }),
    );
    expect(updateTag).toHaveBeenCalledWith("site-settings");
  });
  it("writes a block and audit before invalidating that block tag", async () => {
    assertPermission.mockResolvedValue({ id: "staff-1", role: "staff" });
    const value = {
      ...contentRegistry["home.hero"].defaultValue,
      title: "Edited title",
    };
    const result = await saveBlock({ key: "home.hero", value });
    expect(result).toEqual({
      ok: true,
      data: { key: "home.hero", changedKeys: ["title"] },
    });
    expect(blockUpsert).toHaveBeenCalled();
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          meta: expect.objectContaining({
            changedKeys: ["title"],
            before: { title: contentRegistry["home.hero"].defaultValue.title },
            after: { title: "Edited title" },
          }),
        }),
      }),
    );
    expect(updateTag).toHaveBeenCalledWith("content:home.hero");
  });
  it("allows staff to edit content only, and denies regular users", () => {
    expect(can({ role: "staff" }, "content:write")).toBe(true);
    expect(can({ role: "staff" }, "settings:write")).toBe(false);
    expect(can({ role: "user" }, "content:write")).toBe(false);
    expect(can({ role: "admin" }, "settings:write")).toBe(true);
  });
});
