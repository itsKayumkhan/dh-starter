import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";

describe("application security headers", () => {
  it("sets browser protections and a static Next-compatible CSP", async () => {
    const rules = await nextConfig.headers?.();
    const headers = new Map(
      rules?.[0]?.headers.map(({ key, value }) => [key, value]),
    );
    expect(rules?.[0]?.source).toBe("/:path*");
    expect(headers.get("Content-Security-Policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers.get("Content-Security-Policy")).toContain("'unsafe-inline'");
    expect(headers.get("Content-Security-Policy")).toContain(
      "https://js.stripe.com",
    );
    expect(headers.get("Content-Security-Policy")).toContain(
      "https://res.cloudinary.com",
    );
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headers.has("Permissions-Policy")).toBe(true);
  });
});
