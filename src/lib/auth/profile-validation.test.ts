import { describe, expect, it } from "vitest";
import { validateProfileUpdate } from "@/lib/auth/profile-validation";

describe("profile update hook", () => {
  it("rejects unvalidated raw profile values", () => {
    expect(() => validateProfileUpdate({ name: "x" })).toThrow();
    expect(() => validateProfileUpdate({ name: "x".repeat(81) })).toThrow();
    expect(() =>
      validateProfileUpdate({ image: "http://example.test/pic.png" }),
    ).toThrow();
  });

  it("accepts valid profile values and unrelated admin fields", () => {
    expect(() =>
      validateProfileUpdate({
        name: "Ada",
        image: "https://example.test/pic.png",
      }),
    ).not.toThrow();
    expect(() => validateProfileUpdate({ role: "staff" })).not.toThrow();
  });

  it("stores normalized values from raw requests", () => {
    expect(
      validateProfileUpdate({
        name: "  Ada  ",
        image: " https://example.test/pic.png ",
      }),
    ).toEqual({
      data: { name: "Ada", image: "https://example.test/pic.png" },
    });
  });
});
