import nodemailer from "nodemailer";
import { getServerEnv } from "@/lib/env/server";
import type { ProviderInput } from "@/lib/email/providers/types";
import { AppError } from "@/lib/errors";

export async function send(input: ProviderInput): Promise<{ id?: string }> {
  const env = getServerEnv();
  if (!env.SMTP_HOST)
    throw new AppError("EMAIL_CONFIG", "Email service is unavailable.");
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? (env.SMTP_SECURE ? 465 : 587),
    secure: env.SMTP_SECURE ?? false,
    requireTLS: !(env.SMTP_SECURE ?? false),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  });
  const result = await transport.sendMail(input);
  return { id: result.messageId };
}
