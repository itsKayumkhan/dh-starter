import { Resend } from "resend";
import { getServerEnv } from "@/lib/env/server";
import type { ProviderInput } from "@/lib/email/providers/types";
import { AppError } from "@/lib/errors";

export async function send(input: ProviderInput): Promise<{ id?: string }> {
  const key = getServerEnv().RESEND_API_KEY;
  if (!key) throw new AppError("EMAIL_CONFIG", "Email service is unavailable.");
  const { data, error } = await new Resend(key).emails.send(input);
  if (error) throw new AppError("EMAIL_SEND", "Email could not be sent.");
  return { id: data?.id };
}
