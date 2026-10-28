import { beforeEach, describe, expect, it, vi } from "vitest";

const { cleanupExpiredUploads } = vi.hoisted(() => ({
  cleanupExpiredUploads: vi.fn(),
}));
vi.mock("@/modules/uploads/server/media", () => ({ cleanupExpiredUploads }));
vi.mock("@/modules/uploads/env", () => ({
  getUploadsCronSecret: () => "a".repeat(32),
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
import { GET } from "@/app/api/uploads/cleanup/route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("upload cleanup cron", () => {
  it("denies requests without the bearer secret", async () => {
    const response = await GET(
      new Request("https://app.test/api/uploads/cleanup"),
    );
    expect(response.status).toBe(401);
    expect(cleanupExpiredUploads).not.toHaveBeenCalled();
  });
  it("runs cleanup with the bearer secret", async () => {
    cleanupExpiredUploads.mockResolvedValue({ cleaned: 2, failed: 0 });
    const response = await GET(
      new Request("https://app.test/api/uploads/cleanup", {
        headers: { authorization: `Bearer ${"a".repeat(32)}` },
      }),
    );
    expect(response.status).toBe(200);
    expect(cleanupExpiredUploads).toHaveBeenCalledOnce();
  });
});
