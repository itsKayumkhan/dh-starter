import { getServerEnv } from "@/lib/env/server";
import type { ProviderInput } from "@/lib/email/providers/types";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function send(input: ProviderInput): Promise<{ id?: string }> {
  if (getServerEnv().NODE_ENV === "production")
    throw new AppError("EMAIL_CONFIG", "Email service is unavailable.");
  logger.info("Development email", { to: input.to, subject: input.subject });
  return {};
}
