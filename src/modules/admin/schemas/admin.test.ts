import { describe, expect, it } from "vitest";
import { banDurationSeconds, banUserSchema, inviteUserSchema, mayChangeRole } from "@/modules/admin/schemas/admin";

describe("admin rules", () => {
  it("blocks self role changes and demoting the last admin", () => {
    expect(mayChangeRole("a", "a", "admin", "user", 2)).toBe(false);
    expect(mayChangeRole("a", "b", "admin", "staff", 1)).toBe(false);
    expect(mayChangeRole("a", "b", "admin", "staff", 2)).toBe(true);
  });

  it("accepts only future ban expiries", () => {
    const now = new Date("2026-01-01T12:00:00.000Z");
    expect(banDurationSeconds("2026-01-01T12:01:00.000Z", now)).toBe(60);
    expect(banDurationSeconds("2026-01-01T11:59:00.000Z", now)).toBeUndefined();
    expect(banUserSchema.safeParse({ id: "u", reason: "  " }).success).toBe(false);
  });

  it("normalizes invite email and rejects invalid roles", () => {
    expect(inviteUserSchema.parse({ name: "Alex", email: "ALEX@EXAMPLE.COM", role: "staff" }).email).toBe("alex@example.com");
    expect(inviteUserSchema.safeParse({ name: "Alex", email: "alex@example.com", role: "owner" }).success).toBe(false);
  });
});
