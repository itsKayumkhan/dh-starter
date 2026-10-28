import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/env/server", () => ({ getServerEnv: vi.fn() }));

import { headers } from "next/headers";
import { getServerEnv } from "@/lib/env/server";
import { getClientIp, resolveClientIp } from "./request";

describe("trusted client IP", () => {
  it("uses a shared fallback when no proxy is trusted, ignoring spoofed headers", async () => {
    vi.mocked(headers).mockResolvedValue({
      get: (name: string) =>
        name === "x-forwarded-for" ? "198.51.100.1" : "203.0.113.9",
    } as Awaited<ReturnType<typeof headers>>);
    vi.mocked(getServerEnv).mockReturnValue({
      TRUSTED_PROXY_HOPS: 0,
    } as ReturnType<typeof getServerEnv>);
    expect(await getClientIp()).toBe("unknown");
  });

  it("selects the address appended by one trusted proxy", () => {
    expect(resolveClientIp("198.51.100.1, 203.0.113.9", 1)).toBe("203.0.113.9");
    expect(resolveClientIp("198.51.100.2, 203.0.113.9", 1)).toBe("203.0.113.9");
  });

  it("falls back for a missing or malformed trusted hop", () => {
    expect(resolveClientIp("198.51.100.1", 2)).toBe("unknown");
    expect(resolveClientIp("198.51.100.1, invalid", 1)).toBe("unknown");
  });
});
