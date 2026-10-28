import { describe, expect, it } from "vitest";
import {
  createFormToken,
  isFormTokenReady,
} from "@/modules/contact/server/form-token";

describe("contact form token", () => {
  const secret = "test-secret";
  const now = 1_760_000_000_000;

  it("accepts a signed token after three seconds", () => {
    const token = createFormToken(secret, now);
    expect(isFormTokenReady(token, secret, now + 3000)).toBe(true);
  });

  it("rejects early, expired and modified tokens", () => {
    const token = createFormToken(secret, now);
    expect(isFormTokenReady(token, secret, now + 2999)).toBe(false);
    expect(isFormTokenReady(token, secret, now + 2 * 60 * 60 * 1000 + 1)).toBe(
      false,
    );
    expect(
      isFormTokenReady(`${token.slice(0, -1)}0`, "other-secret", now + 3000),
    ).toBe(false);
  });
});
