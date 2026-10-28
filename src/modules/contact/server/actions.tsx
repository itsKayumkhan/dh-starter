"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSiteSettings } from "@/lib/content/settings";
import { writeAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/env/server";
import { AppError, ConflictError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { safeAction } from "@/lib/safe-action";
import { InquiryAutoReply } from "@/modules/contact/emails/inquiry-auto-reply";
import { InquiryNotification } from "@/modules/contact/emails/inquiry-notification";
import { getContactEnv } from "@/modules/contact/env";
import { CONTACT_ROUTES } from "@/modules/contact/routes";
import {
  inquiryIdSchema,
  inquiryStatusSchema,
  submitInquirySchema,
} from "@/modules/contact/schemas/inquiry";
import { isFormTokenReady } from "@/modules/contact/server/form-token";
import { claimFormToken } from "@/modules/contact/server/form-token-claim";
import {
  createInquiry,
  claimFailedEmail,
  getInquiryForResend,
  setInquiryEmailStatus,
  setInquiryStatus,
} from "@/modules/contact/server/inquiries";

const submitAction = safeAction(
  {
    schema: submitInquirySchema,
    auth: "public",
    rateLimit: { key: "contact:submit", limit: 5, windowSec: 600 },
  },
  async (input, { ip }) => {
    if (
      input.website ||
      !isFormTokenReady(input.formToken, getServerEnv().BETTER_AUTH_SECRET)
    )
      throw new AppError(
        "CONTACT_FORM_INVALID",
        "Please refresh the form and try again.",
      );
    if (!(await claimFormToken(input.formToken)))
      throw new AppError(
        "CONTACT_FORM_REPLAY",
        "Please refresh the form and try again.",
      );

    const userAgent = z
      .string()
      .max(500)
      .nullable()
      .safeParse((await headers()).get("user-agent"));
    const inquiry = await createInquiry({
      name: input.name,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
      source: input.source,
      ip,
      userAgent: userAgent.success ? userAgent.data : null,
    });

    const sitePromise = getSiteSettings();
    const deliveries = await Promise.allSettled([
      (async () => {
        const site = await sitePromise;
        const notifyEmail = getContactEnv().notifyEmail ?? site.supportEmail;
        await sendEmail({
          to: notifyEmail,
          subject: `New inquiry for ${site.name}`,
          react: <InquiryNotification inquiry={inquiry} />,
          replyTo: inquiry.email,
        });
      })(),
      (async () => {
        const site = await sitePromise;
        await sendEmail({
          to: inquiry.email,
          subject: `Thanks for contacting ${site.name}`,
          react: <InquiryAutoReply inquiry={inquiry} />,
        });
      })(),
    ]);
    await Promise.all(
      (["notification", "autoReply"] as const).map(async (channel, index) => {
        const result = deliveries[index];
        await setInquiryEmailStatus(
          inquiry.id,
          channel,
          result?.status === "fulfilled" ? "sent" : "failed",
        );
        if (result?.status === "rejected")
          logger.error("Inquiry email delivery failed", {
            inquiryId: inquiry.id,
            channel,
            error: result.reason,
          });
      }),
    );
    revalidatePath(CONTACT_ROUTES.inquiries);
    return { id: inquiry.id };
  },
);

export async function submitInquiry(input: unknown) {
  return submitAction(input);
}

const statusAction = safeAction(
  {
    schema: z.object({ id: inquiryIdSchema, status: inquiryStatusSchema }),
    permission: "inquiries:read",
  },
  async ({ id, status }, { user, ip }) => {
    const previous = await setInquiryStatus(id, status);
    revalidatePath(CONTACT_ROUTES.inquiries);
    revalidatePath(CONTACT_ROUTES.inquiry(id));
    await writeAudit({
      actorId: user?.id,
      action: "inquiry.status_changed",
      target: { type: "Inquiry", id },
      meta: { previous, status },
      ip,
    });
    return { status };
  },
);

export async function changeInquiryStatus(input: unknown) {
  return statusAction(input);
}

const resendAction = safeAction(
  {
    schema: z.object({
      id: inquiryIdSchema,
      channel: z.enum(["notification", "autoReply"]),
    }),
    permission: "inquiries:read",
    rateLimit: { key: "contact:resend", limit: 10, windowSec: 600 },
  },
  async ({ id, channel }, { user, ip }) => {
    const inquiry = await getInquiryForResend(id);
    const claim = await claimFailedEmail(id, channel);
    if (claim.count !== 1) throw new ConflictError();
    try {
      const site = await getSiteSettings();
      if (channel === "notification") {
        await sendEmail({
          to: getContactEnv().notifyEmail ?? site.supportEmail,
          subject: `New inquiry for ${site.name}`,
          react: <InquiryNotification inquiry={inquiry} />,
          replyTo: inquiry.email,
        });
      } else {
        await sendEmail({
          to: inquiry.email,
          subject: `Thanks for contacting ${site.name}`,
          react: <InquiryAutoReply inquiry={inquiry} />,
        });
      }
      await setInquiryEmailStatus(id, channel, "sent");
    } catch (error) {
      await setInquiryEmailStatus(id, channel, "failed");
      logger.error("Inquiry email resend failed", {
        inquiryId: id,
        channel,
        error,
      });
      throw new AppError(
        "CONTACT_RESEND_FAILED",
        "The email could not be sent.",
      );
    } finally {
      revalidatePath(CONTACT_ROUTES.inquiry(id));
      revalidatePath(CONTACT_ROUTES.inquiries);
    }
    await writeAudit({
      actorId: user?.id,
      action: "inquiry.email_resent",
      target: { type: "Inquiry", id },
      meta: { channel },
      ip,
    });
    return { id };
  },
);

export async function resendInquiryEmail(input: unknown) {
  return resendAction(input);
}
