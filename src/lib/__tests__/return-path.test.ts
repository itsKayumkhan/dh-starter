import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/constants/routes";
import { safeReturnPath } from "@/lib/return-path";

describe("safeReturnPath", () => {
  it("keeps local paths with query strings", () => {
    expect(safeReturnPath(`${ROUTES.admin}?tab=users`)).toBe(
      `${ROUTES.admin}?tab=users`,
    );
  });
  it("rejects external and malformed destinations", () => {
    expect(safeReturnPath("//evil.example")).toBe(ROUTES.dashboard);
    expect(safeReturnPath("/\\evil.example")).toBe(ROUTES.dashboard);
    expect(safeReturnPath("https://evil.example")).toBe(ROUTES.dashboard);
    expect(safeReturnPath(12)).toBe(ROUTES.dashboard);
  });
});
