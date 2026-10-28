import { beforeEach, describe, expect, it, vi } from "vitest";
import { contentRegistry } from "@/config/content";
import { settingsDefaults } from "@/config/settings";
import { can } from "@/lib/auth/permissions";
import { ForbiddenError } from "@/lib/errors";
import { blockRevision, settingsRevision } from "@/modules/cms/server/revision";

const emptyRevision = settingsRevision([]);

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
  blockUpsert.mockResolvedValue({
    updatedAt: new Date("2026-10-28T00:00:00.000Z"),
  });
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
    const result = await saveSettings({
      value: settingsDefaults,
      revision: emptyRevision,
    });
    expect(result.ok).toBe(false);
    expect(assertPermission).toHaveBeenCalledWith("settings:write");
    expect(transaction).not.toHaveBeenCalled();
  });
  it("checks content permission for save and reset", async () => {
    const key = "home.hero";
    const saved = await saveBlock({
      key,
      value: contentRegistry[key].defaultValue,
      revision: null,
    });
    const reset = await resetBlock({ key, revision: null });
    expect(saved.ok).toBe(false);
    expect(reset.ok).toBe(false);
    expect(assertPermission).toHaveBeenNthCalledWith(1, "content:write");
    expect(assertPermission).toHaveBeenNthCalledWith(2, "content:write");
    expect(transaction).not.toHaveBeenCalled();
  });
  it("writes settings and audit together before invalidating the settings tag", async () => {
    assertPermission.mockResolvedValue({ id: "admin-1", role: "admin" });
    const result = await saveSettings({
      value: { ...settingsDefaults, name: "Edited Brand" },
      revision: emptyRevision,
    });
    expect(result).toEqual({
      ok: true,
      data: { changedKeys: ["name"], revision: emptyRevision },
    });
    expect(settingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { key: "name" } }),
    );
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          meta: expect.objectContaining({
            changedKeys: ["name"],
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
    const result = await saveBlock({ key: "home.hero", value, revision: null });
    expect(result).toEqual({
      ok: true,
      data: {
        key: "home.hero",
        changedKeys: ["title"],
        revision: blockRevision({
          updatedAt: new Date("2026-10-28T00:00:00.000Z"),
          value,
        }),
      },
    });
    expect(blockUpsert).toHaveBeenCalled();
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          meta: expect.objectContaining({
            changedKeys: ["title"],
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
  it("rejects a stale settings revision before any mutation", async () => {
    assertPermission.mockResolvedValue({ id: "admin-1", role: "admin" });
    settingsRows.mockResolvedValue([
      {
        key: "name",
        value: "Current",
        updatedAt: new Date("2026-10-28T00:00:00.000Z"),
      },
    ]);
    const result = await saveSettings({
      value: settingsDefaults,
      revision: emptyRevision,
    });
    expect(result.ok).toBe(false);
    expect(settingUpsert).not.toHaveBeenCalled();
    expect(settingDelete).not.toHaveBeenCalled();
  });
  it("rejects a stale content revision before any mutation", async () => {
    assertPermission.mockResolvedValue({ id: "staff-1", role: "staff" });
    blockRow.mockResolvedValue({
      value: contentRegistry["home.hero"].defaultValue,
      updatedAt: new Date("2026-10-28T00:00:00.000Z"),
    });
    const result = await saveBlock({
      key: "home.hero",
      value: contentRegistry["home.hero"].defaultValue,
      revision: null,
    });
    expect(result.ok).toBe(false);
    expect(blockUpsert).not.toHaveBeenCalled();
  });
  it("resets a JSON null content row", async () => {
    assertPermission.mockResolvedValue({ id: "staff-1", role: "staff" });
    blockRow.mockResolvedValue({
      value: null,
      updatedAt: new Date("2026-10-28T00:00:00.000Z"),
    });
    const result = await resetBlock({
      key: "home.hero",
      revision: blockRevision({
        updatedAt: new Date("2026-10-28T00:00:00.000Z"),
        value: null,
      }),
    });
    expect(result.ok).toBe(true);
    expect(blockDelete).toHaveBeenCalled();
  });
});
