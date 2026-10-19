import { describe, expect, it } from "vitest";
import { can, type Permission } from "@/lib/auth/permissions";
describe("permissions", () => {
  it("fails closed for unknown or banned roles", () => {
    expect(can({ role: "owner" }, "users:read")).toBe(false);
    expect(can({ role: "admin", banned: true }, "users:read")).toBe(false);
    expect(can(null, "users:read")).toBe(false);
    expect(can({ role: "admin" }, "unknown" as Permission)).toBe(false);
  });
  it("allows configured roles", () => {
    expect(can({ role: "staff" }, "users:read")).toBe(true);
    expect(can({ role: "user" }, "users:read")).toBe(false);
  });
});
