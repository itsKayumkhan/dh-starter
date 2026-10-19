import { describe, expect, it } from "vitest";
import { sanitizeNext } from "@/components/auth/safe-redirect";
import { ROUTES } from "@/lib/constants/routes";

describe("sanitizeNext", () => {
  it.each([
    undefined,
    null,
    "",
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%5Cevil.test",
    "/%252F%252Fevil.test",
    "javascript:alert(1)",
    "/ok\nnext",
  ])("rejects unsafe value %s", (value) =>
    expect(sanitizeNext(value)).toBe(ROUTES.dashboard),
  );
  it("keeps a local path and its query", () => {
    expect(sanitizeNext("/dashboard/account?tab=security")).toBe(
      "/dashboard/account?tab=security",
    );
  });
});
