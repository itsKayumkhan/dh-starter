import "server-only";
import type { ReactElement } from "react";
import { render } from "react-email";
import { getServerEnv } from "@/lib/env/server";
import { providers } from "@/lib/email/providers";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getSiteSettings } from "@/lib/content/settings";
import { withEmailBrand } from "@/lib/email/brand-context";

export async function sendEmail(input: {
  to: string;
  subject: string;
  react: ReactElement;
  text?: string;
  replyTo?: string;
}): Promise<{ ok: true; id?: string }> {
  try {
    const env = getServerEnv();
    const settings = await getSiteSettings();
    const { html, text } = await withEmailBrand(settings, async () => ({
      html: await render(input.react),
      text: input.text ?? (await render(input.react, { plainText: true })),
    }));
    const result = await providers[env.EMAIL_PROVIDER]({
      to: input.to,
      from: env.EMAIL_FROM,
      subject: input.subject,
      html,
      text,
      replyTo: input.replyTo,
    });
    return { ok: true, ...result };
  } catch (error) {
    logger.error("Email send failed", { error });
    throw new AppError("EMAIL_SEND", "Email could not be sent.");
  }
}
