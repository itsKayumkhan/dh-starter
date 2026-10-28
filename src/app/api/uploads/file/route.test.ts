import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  assertUser,
  assertPermission,
  getPendingUpload,
  claimPendingUpload,
  markPendingUploaded,
  upload,
} = vi.hoisted(() => ({
  assertUser: vi.fn(),
  assertPermission: vi.fn(),
  getPendingUpload: vi.fn(),
  claimPendingUpload: vi.fn(),
  markPendingUploaded: vi.fn(),
  upload: vi.fn(),
}));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ assertUser, assertPermission }));
vi.mock("@/lib/env/server", () => ({
  getServerEnv: () => ({ BETTER_AUTH_URL: "https://app.test" }),
}));
vi.mock("@/modules/uploads/server/media", () => ({
  getPendingUpload,
  claimPendingUpload,
  markPendingUploaded,
}));
vi.mock("@/modules/uploads/server/storage", () => ({
  storage: { upload, destroy: vi.fn() },
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { POST } from "@/app/api/uploads/file/route";

beforeEach(() => {
  vi.clearAllMocks();
  assertUser.mockResolvedValue({ id: "user-1" });
  getPendingUpload.mockResolvedValue({
    folder: "avatars",
    expectedBytes: 1,
    mimeType: "image/png",
    uploadedAt: null,
    uploadingAt: null,
  });
});

describe("bounded upload endpoint", () => {
  it("rejects more bytes than the signed intent even without Content-Length", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.close();
      },
    });
    const request = new Request("https://app.test/api/uploads/file", {
      method: "POST",
      body,
      duplex: "half",
      headers: {
        origin: "https://app.test",
        "content-type": "image/png",
        "x-upload-folder": "avatars",
        "x-upload-public-id": "asset-1",
        "x-upload-ticket": "ticket",
      },
    } as RequestInit & { duplex: "half" });
    expect((await POST(request)).status).toBe(413);
    expect(claimPendingUpload).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });
});
