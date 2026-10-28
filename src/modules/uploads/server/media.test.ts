import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  transaction,
  pendingFindMany,
  pendingDeleteMany,
  mediaFindMany,
  destroy,
} = vi.hoisted(() => ({
  transaction: vi.fn(),
  pendingFindMany: vi.fn(),
  pendingDeleteMany: vi.fn(),
  mediaFindMany: vi.fn(),
  destroy: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    $transaction: transaction,
    pendingUpload: { findMany: pendingFindMany, deleteMany: pendingDeleteMany },
    media: { findMany: mediaFindMany },
  },
}));
vi.mock("@/modules/uploads/server/storage", () => ({ storage: { destroy } }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
import { cleanupExpiredUploads } from "@/modules/uploads/server/media";

beforeEach(() => {
  vi.clearAllMocks();
  pendingFindMany.mockResolvedValue([{ publicId: "app/avatars/asset" }]);
  pendingDeleteMany.mockResolvedValue({ count: 1 });
  mediaFindMany.mockResolvedValue([]);
  destroy.mockResolvedValue(undefined);
});

describe("abandoned upload cleanup", () => {
  it("destroys all Cloudinary resource types before removing the intent", async () => {
    expect(await cleanupExpiredUploads()).toEqual({ cleaned: 1, failed: 0 });
    expect(destroy.mock.calls.map(([input]) => input.resourceType)).toEqual([
      "image",
      "raw",
      "video",
    ]);
    expect(pendingDeleteMany).toHaveBeenCalledOnce();
  });
  it("keeps the intent for retry if Cloudinary deletion fails", async () => {
    destroy.mockRejectedValueOnce(new Error("Cloudinary unavailable"));
    expect(await cleanupExpiredUploads()).toEqual({ cleaned: 0, failed: 1 });
    expect(pendingDeleteMany).not.toHaveBeenCalled();
  });
});
