import { describe, expect, it } from "vitest";
import {
  passwordStrength,
  resetPasswordSchema,
  signupSchema,
} from "@/components/auth/schemas";

describe("auth form schemas", () => {
  it("rejects mismatched signup passwords", () => {
    expect(
      signupSchema.safeParse({
        name: "Ada",
        email: "ada@example.com",
        password: "Password123",
        confirmPassword: "different",
      }).success,
    ).toBe(false);
  });
  it("rejects short reset passwords", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);
  });
  it("rates stronger passwords above short ones", () => {
    expect(passwordStrength("a")).toBe("weak");
    expect(passwordStrength("LongPass123!")).toBe("strong");
  });
});
