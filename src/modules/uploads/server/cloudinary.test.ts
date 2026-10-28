import { beforeEach, describe, expect, it, vi } from "vitest";

const { uploadStream, resource, destroy } = vi.hoisted(() => ({
  uploadStream: vi.fn(),
  resource: vi.fn(),
  destroy: vi.fn(),
}));
vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: { upload_stream: uploadStream, destroy },
    api: { resource },
  },
}));
vi.mock("@/modules/uploads/env", () => ({
  getUploadsEnv: () => ({
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "test-cloud",
    CLOUDINARY_API_KEY: "key",
    CLOUDINARY_API_SECRET: "secret-secret-secret",
    CLOUDINARY_FOLDER_PREFIX: "app",
  }),
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
import { cloudinaryStorage } from "@/modules/uploads/server/cloudinary";

beforeEach(() => {
  vi.clearAllMocks();
  destroy.mockResolvedValue({ result: "ok" });
});

describe("Cloudinary size enforcement", () => {
  it("does not forward a file larger than the folder limit", async () => {
    const signed = await cloudinaryStorage.sign({
      folder: "avatars",
      ownerId: "user-1",
    });
    await expect(
      cloudinaryStorage.upload({
        folder: "avatars",
        ownerId: "user-1",
        publicId: signed.publicId,
        ticket: signed.ticket,
        bytes: Buffer.alloc(2 * 1024 * 1024 + 1),
      }),
    ).rejects.toThrow();
    expect(uploadStream).not.toHaveBeenCalled();
  });
  it("destroys an asset when Cloudinary reports an excessive stored size", async () => {
    const signed = await cloudinaryStorage.sign({
      folder: "avatars",
      ownerId: "user-1",
    });
    uploadStream.mockImplementation((_options, callback) => ({
      end: () =>
        callback(null, {
          public_id: signed.publicId,
          resource_type: "image",
        }),
    }));
    resource.mockResolvedValue({
      public_id: signed.publicId,
      secure_url: "https://res.cloudinary.com/test/image.png",
      resource_type: "image",
      type: "upload",
      format: "png",
      bytes: 3 * 1024 * 1024,
    });
    await expect(
      cloudinaryStorage.upload({
        folder: "avatars",
        ownerId: "user-1",
        publicId: signed.publicId,
        ticket: signed.ticket,
        bytes: Buffer.from([1]),
      }),
    ).rejects.toThrow();
    expect(destroy).toHaveBeenCalledWith(
      signed.publicId,
      expect.objectContaining({ resource_type: "image", invalidate: true }),
    );
  });
});
