import "server-only";
import { z } from "zod";

const optionalEnv = (value: unknown) => (value === "" ? undefined : value);
const emailAddress = z.string().refine((value) => {
  const address = value.match(/<([^<>]+)>$/)?.[1] ?? value;
  return z.email().safeParse(address).success;
}, "Enter a valid sender address");

const serverEnvSchema = z
  .object({
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    EMAIL_PROVIDER: z.enum(["resend", "smtp", "console"]).default("console"),
    EMAIL_FROM: emailAddress,
    RESEND_API_KEY: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.preprocess(
      optionalEnv,
      z.coerce.number().int().positive().optional(),
    ),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_SECURE: z.preprocess(
      optionalEnv,
      z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional(),
    ),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  })
  .superRefine((value, ctx) => {
    if (value.EMAIL_PROVIDER === "resend" && !value.RESEND_API_KEY)
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "Required for Resend",
      });
    if (value.EMAIL_PROVIDER === "smtp" && !value.SMTP_HOST)
      ctx.addIssue({
        code: "custom",
        path: ["SMTP_HOST"],
        message: "Required for SMTP",
      });
    if (value.EMAIL_PROVIDER === "console" && value.NODE_ENV === "production")
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL_PROVIDER"],
        message: "Console email is disabled in production",
      });
    if (Boolean(value.GOOGLE_CLIENT_ID) !== Boolean(value.GOOGLE_CLIENT_SECRET))
      ctx.addIssue({
        code: "custom",
        path: ["GOOGLE_CLIENT_SECRET"],
        message: "Both Google credentials are required",
      });
  });

let cached: z.infer<typeof serverEnvSchema> | undefined;
export function getServerEnv() {
  cached ??= serverEnvSchema.parse(process.env);
  return cached;
}

export function isGoogleAuthEnabled() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = getServerEnv();
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}
