import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(async () => new Response("allowed")),
  post: vi.fn(async () => new Response("allowed")),
}));

vi.mock("@/lib/auth/server", () => ({ auth: { api: {} } }));
vi.mock("better-auth/next-js", () => ({
  toNextJsHandler: () => ({ GET: mocks.get, POST: mocks.post }),
}));

import { GET, POST } from "./route";

describe("public Better Auth handler", () => {
  it("rejects public admin plugin endpoints before Better Auth receives them", async () => {
    const response = await POST(
      new Request("https://example.test/api/auth/admin/set-role", {
        method: "POST",
      }),
    );
    expect(response.status).toBe(404);
    expect(mocks.post).not.toHaveBeenCalled();
    expect(
      (await GET(new Request("https://example.test/api/auth/admin/list-users")))
        .status,
    ).toBe(404);
    expect(
      (
        await POST(
          new Request("https://example.test/api/auth/admin%252Fset-role", {
            method: "POST",
          }),
        )
      ).status,
    ).toBe(404);
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("rejects direct deletion requests but permits verified callbacks", async () => {
    expect(
      (
        await POST(
          new Request("https://example.test/api/auth/delete-user", {
            method: "POST",
          }),
        )
      ).status,
    ).toBe(404);
    expect(mocks.post).not.toHaveBeenCalled();
    expect(
      (
        await GET(
          new Request(
            "https://example.test/api/auth/delete-user/callback?token=verified",
          ),
        )
      ).status,
    ).toBe(200);
    expect(mocks.get).toHaveBeenCalledOnce();
  });
});
