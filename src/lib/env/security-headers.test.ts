import { afterEach, describe, expect, it } from "vitest";
import { shouldSetProductionHsts } from "./security-headers";

const originalEnv = { ...process.env };

describe("HSTS deployment guard", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("enables HSTS for production HTTPS origins", () => {
    process.env = {
      ...process.env,
      NODE_ENV: "production",
      BETTER_AUTH_URL: "https://example.test",
    };
    expect(shouldSetProductionHsts()).toBe(true);
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    expect(shouldSetProductionHsts()).toBe(false);
  });
});
