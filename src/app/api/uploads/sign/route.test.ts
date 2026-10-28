import { beforeEach, describe, expect, it, vi } from "vitest";

const { assertUser, assertRateLimit, createPendingUpload, sign } = vi.hoisted(
  () => ({
    assertUser: vi.fn(),
    assertRateLimit: vi.fn(),
    createPendingUpload: vi.fn(),
    sign: vi.fn(),
  }),
);
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({
  assertUser,
  assertPermission: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit }));
vi.mock("@/lib/env/server", () => ({
  getServerEnv: () => ({ BETTER_AUTH_URL: "https://app.test" }),
}));
vi.mock("@/modules/uploads/server/media", () => ({ createPendingUpload }));
vi.mock("@/modules/uploads/server/storage", () => ({ storage: { sign } }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { POST } from "@/app/api/uploads/sign/route";

beforeEach(() => {
  vi.clearAllMocks();
  assertUser.mockResolvedValue({ id: "user-1" });
  sign.mockResolvedValue({
    uploadUrl: "/api/uploads/file",
    publicId: "asset-1",
    folder: "avatars",
    ticket: "ticket",
  });
});

describe("upload signing", () => {
  it("records a pending intent and never exposes Cloudinary upload credentials", async () => {
    const response = await POST(
      new Request("https://app.test/api/uploads/sign", {
        method: "POST",
        headers: {
          origin: "https://app.test",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          folder: "avatars",
          bytes: 1,
          mimeType: "image/png",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(createPendingUpload).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: "user-1", expectedBytes: 1 }),
    );
    const body = await response.json();
    expect(body.uploadUrl).toBe("/api/uploads/file");
    expect(body).not.toHaveProperty("apiKey");
    expect(body).not.toHaveProperty("signature");
  });
  it("rejects a sibling origin before consuming the sign rate limit", async () => {
    const response = await POST(
      new Request("https://app.test/api/uploads/sign", {
        method: "POST",
        headers: {
          origin: "https://evil.app.test",
          "content-type": "text/plain",
        },
        body: JSON.stringify({
          folder: "avatars",
          bytes: 1,
          mimeType: "image/png",
        }),
      }),
    );
    expect(response.status).toBe(403);
    expect(assertRateLimit).not.toHaveBeenCalled();
    expect(sign).not.toHaveBeenCalled();
  });
  it("requires JSON before consuming the sign rate limit", async () => {
    const response = await POST(
      new Request("https://app.test/api/uploads/sign", {
        method: "POST",
        headers: { origin: "https://app.test", "content-type": "text/plain" },
        body: JSON.stringify({
          folder: "avatars",
          bytes: 1,
          mimeType: "image/png",
        }),
      }),
    );
    expect(response.status).toBe(415);
    expect(assertRateLimit).not.toHaveBeenCalled();
  });
});
