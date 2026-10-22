import { describe, expect, it } from "vitest";
import { z } from "zod";
import { formatEnvError } from "@/lib/env/format-env-error";

describe("formatEnvError", () => {
  const schema = z.object({
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    EMAIL_PROVIDER: z.enum(["resend", "smtp"]),
  });

  it("names missing and invalid keys with a setup hint", () => {
    const parsed = schema.safeParse({
      BETTER_AUTH_SECRET: "short",
      EMAIL_PROVIDER: "console",
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(formatEnvError(parsed.error, { source: ".env.example" })).toBe(
      "Invalid environment variables: DATABASE_URL is missing, BETTER_AUTH_SECRET must be at least 32 characters, EMAIL_PROVIDER has an invalid value. Copy .env.example to .env and fill them in.",
    );
  });

  it("never includes supplied secret values in the error", () => {
    const secret = "sensitive-secret";
    const parsed = schema.safeParse({
      DATABASE_URL: "not-a-url",
      BETTER_AUTH_SECRET: secret,
      EMAIL_PROVIDER: "resend",
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const message = formatEnvError(parsed.error, { source: ".env.example" });
    expect(message).toContain("DATABASE_URL must be a valid URL");
    expect(message).not.toContain(secret);
    expect(message).not.toContain("not-a-url");
  });

  it("describes provider requirements without exposing credentials", () => {
    const parsed = z
      .object({ RESEND_API_KEY: z.string().optional() })
      .superRefine((_, ctx) =>
        ctx.addIssue({
          code: "custom",
          path: ["RESEND_API_KEY"],
          message: "Required for Resend",
        }),
      )
      .safeParse({});
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(formatEnvError(parsed.error, { source: ".env.example" })).toContain(
      "RESEND_API_KEY is required for Resend",
    );
  });
});
