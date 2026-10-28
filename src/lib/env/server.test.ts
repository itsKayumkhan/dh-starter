import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const originalEnv = { ...process.env };

describe("SMTP environment validation", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it.each([
    ["user", ""],
    ["", "pass"],
  ])("rejects a partial credential pair", async (user, pass) => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: "postgres://postgres:pass@localhost:5432/starter",
      BETTER_AUTH_SECRET: "a".repeat(32),
      BETTER_AUTH_URL: "http://localhost:3000",
      EMAIL_FROM: "sender@example.test",
      EMAIL_PROVIDER: "smtp",
      SMTP_HOST: "smtp.example.test",
      SMTP_USER: user,
      SMTP_PASS: pass,
    };
    const { getServerEnv } = await import("./server");
    expect(() => getServerEnv()).toThrow("SMTP_PASS");
  });
});
