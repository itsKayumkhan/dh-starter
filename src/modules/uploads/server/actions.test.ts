import { beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimitError, UnauthorizedError } from "@/lib/errors";
import { MESSAGES } from "@/lib/constants/messages";
import { UPLOAD_ROUTES } from "@/modules/uploads/routes";

const {
  assertUser,
  assertRateLimit,
  getClientIp,
  revalidatePath,
  logError,
  verify,
  destroy,
  transaction,
  mediaFindUnique,
  pendingFindUnique,
  mediaCreate,
  mediaUpdateMany,
  mediaDeleteMany,
  pendingDelete,
  auditCreate,
} = vi.hoisted(() => ({
  assertUser: vi.fn(),
  assertRateLimit: vi.fn(),
  getClientIp: vi.fn(),
  revalidatePath: vi.fn(),
  logError: vi.fn(),
  verify: vi.fn(),
  destroy: vi.fn(),
  transaction: vi.fn(),
  mediaFindUnique: vi.fn(),
  pendingFindUnique: vi.fn(),
  mediaCreate: vi.fn(),
  mediaUpdateMany: vi.fn(),
  mediaDeleteMany: vi.fn(),
  pendingDelete: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/auth/session", () => ({ assertUser }));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit }));
vi.mock("@/lib/request", () => ({ getClientIp }));
vi.mock("@/lib/logger", () => ({ logger: { error: logError } }));
vi.mock("@/modules/uploads/server/storage", () => ({
  storage: { verify, destroy },
}));
vi.mock("@/lib/db", () => ({
  db: {
    $transaction: transaction,
    media: { findUnique: mediaFindUnique },
  },
}));

import { deleteMedia, saveMedia } from "@/modules/uploads/server/actions";

const user = { id: "user-1", role: "user", banned: false };
const staff = { id: "staff-1", role: "staff", banned: false };
const ticket = `123.${"a".repeat(64)}`;
const publicId = "app/avatars/asset";
const id = "clh1234567890abcdefghijk";
const createdAt = new Date("2026-10-28T00:00:00.000Z");
const saveInput = { folder: "avatars", publicId, ticket, alt: "  Portrait  " };
const asset = {
  publicId,
  url: "https://res.cloudinary.com/test/image.png",
  resourceType: "image",
  format: "png",
  bytes: 128,
  width: 16,
  height: 16,
  folder: "avatars",
};
const media = {
  id,
  ownerId: user.id,
  ...asset,
  alt: "Portrait",
  createdAt,
  deletePendingAt: null,
};

function expectNoWrites() {
  expect(transaction).not.toHaveBeenCalled();
  expect(mediaCreate).not.toHaveBeenCalled();
  expect(mediaUpdateMany).not.toHaveBeenCalled();
  expect(mediaDeleteMany).not.toHaveBeenCalled();
  expect(pendingDelete).not.toHaveBeenCalled();
  expect(auditCreate).not.toHaveBeenCalled();
  expect(destroy).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  assertUser.mockResolvedValue(user);
  assertRateLimit.mockResolvedValue(undefined);
  getClientIp.mockResolvedValue("127.0.0.1");
  verify.mockResolvedValue(asset);
  destroy.mockResolvedValue(undefined);
  mediaFindUnique.mockResolvedValue(null);
  pendingFindUnique.mockResolvedValue({
    ownerId: user.id,
    folder: "avatars",
    uploadedAt: new Date("2026-10-28T00:00:00.000Z"),
    expiresAt: new Date("2099-01-01T00:00:00.000Z"),
  });
  mediaCreate.mockResolvedValue(media);
  mediaUpdateMany.mockResolvedValue({ count: 1 });
  mediaDeleteMany.mockResolvedValue({ count: 1 });
  pendingDelete.mockResolvedValue({});
  auditCreate.mockResolvedValue({ id: "audit-1" });
  transaction.mockImplementation(
    async (handler: (tx: unknown) => Promise<unknown>) =>
      handler({
        pendingUpload: { findUnique: pendingFindUnique, delete: pendingDelete },
        media: {
          create: mediaCreate,
          updateMany: mediaUpdateMany,
          deleteMany: mediaDeleteMany,
        },
        auditLog: { create: auditCreate },
      }),
  );
});

describe("saveMedia", () => {
  it("verifies and saves an avatar with an audit entry and cache refresh", async () => {
    // Exact match: the DTO never carries ownerId, deletePendingAt or other internal columns.
    expect(await saveMedia(saveInput)).toStrictEqual({
      ok: true,
      data: {
        id,
        ...asset,
        alt: "Portrait",
        createdAt: createdAt.toISOString(),
      },
    });
    expect(assertRateLimit).toHaveBeenCalledWith(
      "uploads:save:user-1",
      30,
      3600,
    );
    expect(verify).toHaveBeenCalledWith({
      folder: "avatars",
      ownerId: user.id,
      publicId,
      ticket,
    });
    expect(pendingFindUnique).toHaveBeenCalledWith({ where: { publicId } });
    expect(mediaCreate).toHaveBeenCalledWith({
      data: { ownerId: user.id, ...asset, alt: "Portrait" },
    });
    expect(auditCreate).toHaveBeenCalledWith({
      data: {
        actorId: user.id,
        action: "media.create",
        targetType: "Media",
        targetId: id,
        meta: { folder: "avatars", publicId },
        ip: "127.0.0.1",
      },
    });
    expect(pendingDelete).toHaveBeenCalledWith({ where: { publicId } });
    expect(revalidatePath).toHaveBeenCalledExactlyOnceWith(UPLOAD_ROUTES.media);
  });

  it("allows staff to save an admin folder", async () => {
    assertUser.mockResolvedValue(staff);
    verify.mockResolvedValue({ ...asset, folder: "media" });
    pendingFindUnique.mockResolvedValue({
      ownerId: staff.id,
      folder: "media",
      uploadedAt: createdAt,
      expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    });
    await saveMedia({ ...saveInput, folder: "media" });
    expect(mediaCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ ownerId: staff.id, folder: "media" }),
    });
  });

  it.each([
    ["missing input", undefined, "_form"],
    ["missing folder", { publicId, ticket }, "folder"],
    ["unknown folder", { ...saveInput, folder: "unknown" }, "folder"],
    ["empty public ID", { ...saveInput, publicId: "" }, "publicId"],
    ["long public ID", { ...saveInput, publicId: "x".repeat(301) }, "publicId"],
    ["bad ticket", { ...saveInput, ticket: "invalid" }, "ticket"],
    ["long alt", { ...saveInput, alt: "x".repeat(251) }, "alt"],
    ["wrong alt type", { ...saveInput, alt: 42 }, "alt"],
  ])(
    "rejects %s with a field error before auth or writes",
    async (_name, input, field) => {
      const result = await saveMedia(input);
      expect(result).toMatchObject({
        ok: false,
        error: MESSAGES.validation,
        fieldErrors: { [field as string]: expect.any(Array) },
      });
      expect(assertUser).not.toHaveBeenCalled();
      expect(verify).not.toHaveBeenCalled();
      expectNoWrites();
    },
  );

  it("denies an anonymous caller", async () => {
    assertUser.mockRejectedValue(new UnauthorizedError());
    expect(await saveMedia(saveInput)).toEqual({
      ok: false,
      error: MESSAGES.unauthorized,
    });
    expect(verify).not.toHaveBeenCalled();
    expectNoWrites();
  });

  it("denies an ordinary user for the media folder", async () => {
    expect(await saveMedia({ ...saveInput, folder: "media" })).toEqual({
      ok: false,
      error: MESSAGES.forbidden,
    });
    expect(verify).not.toHaveBeenCalled();
    expectNoWrites();
  });

  it("stops before verification when the rate limit is denied", async () => {
    assertRateLimit.mockRejectedValue(new RateLimitError());
    expect(await saveMedia(saveInput)).toEqual({
      ok: false,
      error: MESSAGES.rateLimited,
    });
    expect(verify).not.toHaveBeenCalled();
    expectNoWrites();
  });

  it("returns the existing record without a duplicate write", async () => {
    mediaFindUnique.mockResolvedValue(media);
    expect(await saveMedia(saveInput)).toMatchObject({
      ok: true,
      data: { id, createdAt: createdAt.toISOString() },
    });
    expect(mediaFindUnique).toHaveBeenCalledWith({ where: { publicId } });
    expectNoWrites();
  });

  it("does not disclose another owner's existing asset", async () => {
    mediaFindUnique.mockResolvedValue({ ...media, ownerId: "user-2" });
    expect(await saveMedia(saveInput)).toEqual({
      ok: false,
      error: MESSAGES.forbidden,
    });
    expectNoWrites();
  });

  it("rejects an upload intent owned by another user", async () => {
    pendingFindUnique.mockResolvedValue({
      ownerId: "user-2",
      folder: "avatars",
      uploadedAt: createdAt,
      expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    });
    expect(await saveMedia(saveInput)).toEqual({
      ok: false,
      error: MESSAGES.validation,
    });
    expect(mediaCreate).not.toHaveBeenCalled();
    expect(pendingDelete).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects a verified asset with no matching upload intent", async () => {
    pendingFindUnique.mockResolvedValue(null);
    expect(await saveMedia(saveInput)).toEqual({
      ok: false,
      error: MESSAGES.validation,
    });
    expect(mediaCreate).not.toHaveBeenCalled();
    expect(pendingDelete).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects an asset already queued for deletion", async () => {
    mediaFindUnique.mockResolvedValue({ ...media, deletePendingAt: createdAt });
    expect(await saveMedia(saveInput)).toEqual({
      ok: false,
      error: MESSAGES.conflict,
    });
    expectNoWrites();
  });

  it("returns a generic error if verification fails", async () => {
    verify.mockRejectedValue(new Error("provider token leaked"));
    expect(await saveMedia(saveInput)).toEqual({
      ok: false,
      error: MESSAGES.internal,
    });
    expect(logError).toHaveBeenCalled();
    expectNoWrites();
  });

  it("does not remove the pending upload when the audit insert fails", async () => {
    let storedMedia = false;
    transaction.mockImplementation(
      async (handler: (tx: unknown) => Promise<unknown>) => {
        let nextMedia = storedMedia;
        const result = await handler({
          pendingUpload: {
            findUnique: pendingFindUnique,
            delete: pendingDelete,
          },
          media: {
            create: vi.fn(async (input: unknown) => {
              mediaCreate(input);
              nextMedia = true;
              return media;
            }),
          },
          auditLog: { create: auditCreate },
        });
        storedMedia = nextMedia;
        return result;
      },
    );
    auditCreate.mockRejectedValue(new Error("database secret"));
    expect(await saveMedia(saveInput)).toEqual({
      ok: false,
      error: MESSAGES.internal,
    });
    expect(mediaCreate).toHaveBeenCalledOnce();
    expect(storedMedia).toBe(false);
    expect(pendingDelete).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("deleteMedia", () => {
  beforeEach(() => {
    mediaFindUnique.mockResolvedValue(media);
  });

  it("deletes an owned avatar and writes both audit entries", async () => {
    expect(await deleteMedia({ id })).toEqual({ ok: true, data: { id } });
    expect(assertRateLimit).toHaveBeenCalledWith(
      "uploads:delete:user-1",
      30,
      3600,
    );
    expect(mediaFindUnique).toHaveBeenCalledWith({ where: { id } });
    expect(mediaUpdateMany).toHaveBeenCalledWith({
      where: { id, deletePendingAt: null },
      data: {
        deletePendingAt: expect.any(Date),
        deleteRequestedBy: user.id,
        deleteRequestIp: "127.0.0.1",
      },
    });
    expect(destroy).toHaveBeenCalledWith({ publicId, resourceType: "image" });
    expect(mediaDeleteMany).toHaveBeenCalledWith({
      where: { id, deletePendingAt: { not: null } },
    });
    expect(auditCreate.mock.calls.map(([input]) => input.data.action)).toEqual([
      "media.delete_requested",
      "media.delete",
    ]);
    expect(auditCreate).toHaveBeenNthCalledWith(1, {
      data: {
        actorId: user.id,
        action: "media.delete_requested",
        targetType: "Media",
        targetId: id,
        meta: { folder: "avatars", publicId },
        ip: "127.0.0.1",
      },
    });
    expect(auditCreate).toHaveBeenNthCalledWith(2, {
      data: {
        actorId: user.id,
        action: "media.delete",
        targetType: "Media",
        targetId: id,
        meta: { folder: "avatars", publicId },
        ip: "127.0.0.1",
      },
    });
    expect(revalidatePath).toHaveBeenCalledExactlyOnceWith(UPLOAD_ROUTES.media);
  });

  it("allows staff to delete a media-folder record", async () => {
    assertUser.mockResolvedValue(staff);
    mediaFindUnique.mockResolvedValue({
      ...media,
      folder: "media",
      ownerId: "user-2",
    });
    expect(await deleteMedia({ id })).toEqual({ ok: true, data: { id } });
    expect(mediaUpdateMany).toHaveBeenCalledOnce();
  });

  it.each([
    ["missing input", undefined, "_form"],
    ["missing ID", {}, "id"],
    ["malformed ID", { id: "bad" }, "id"],
    ["wrong ID type", { id: 42 }, "id"],
  ])(
    "rejects %s with a field error before auth or writes",
    async (_name, input, field) => {
      expect(await deleteMedia(input)).toMatchObject({
        ok: false,
        error: MESSAGES.validation,
        fieldErrors: { [field as string]: expect.any(Array) },
      });
      expect(assertUser).not.toHaveBeenCalled();
      expectNoWrites();
    },
  );

  it("denies an anonymous caller", async () => {
    assertUser.mockRejectedValue(new UnauthorizedError());
    expect(await deleteMedia({ id })).toEqual({
      ok: false,
      error: MESSAGES.unauthorized,
    });
    expect(mediaFindUnique).not.toHaveBeenCalled();
    expectNoWrites();
  });

  it("stops before lookup when the rate limit is denied", async () => {
    assertRateLimit.mockRejectedValue(new RateLimitError());
    expect(await deleteMedia({ id })).toEqual({
      ok: false,
      error: MESSAGES.rateLimited,
    });
    expect(mediaFindUnique).not.toHaveBeenCalled();
    expectNoWrites();
  });

  it("denies deletion of another user's avatar", async () => {
    mediaFindUnique.mockResolvedValue({ ...media, ownerId: "user-2" });
    expect(await deleteMedia({ id })).toEqual({
      ok: false,
      error: MESSAGES.forbidden,
    });
    expectNoWrites();
  });

  it("denies a user without media permission for a shared folder", async () => {
    mediaFindUnique.mockResolvedValue({ ...media, folder: "documents" });
    expect(await deleteMedia({ id })).toEqual({
      ok: false,
      error: MESSAGES.forbidden,
    });
    expectNoWrites();
  });

  it.each([
    ["missing", null],
    ["already pending", { ...media, deletePendingAt: createdAt }],
  ])("returns not found for %s records", async (_name, record) => {
    mediaFindUnique.mockResolvedValue(record);
    expect(await deleteMedia({ id })).toEqual({
      ok: false,
      error: MESSAGES.notFound,
    });
    expectNoWrites();
  });

  it("returns a generic error when the lookup fails", async () => {
    mediaFindUnique.mockRejectedValue(new Error("database secret"));
    expect(await deleteMedia({ id })).toEqual({
      ok: false,
      error: MESSAGES.internal,
    });
    expectNoWrites();
  });

  it("does not destroy the asset if the deletion request audit fails", async () => {
    auditCreate.mockRejectedValueOnce(new Error("database secret"));
    expect(await deleteMedia({ id })).toEqual({
      ok: false,
      error: MESSAGES.internal,
    });
    expect(mediaUpdateMany).toHaveBeenCalledOnce();
    expect(destroy).not.toHaveBeenCalled();
    expect(mediaDeleteMany).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("retains the pending record for retry if provider deletion fails", async () => {
    destroy.mockRejectedValue(new Error("provider token leaked"));
    expect(await deleteMedia({ id })).toEqual({
      ok: false,
      error: MESSAGES.internal,
    });
    expect(mediaUpdateMany).toHaveBeenCalledOnce();
    expect(mediaDeleteMany).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
