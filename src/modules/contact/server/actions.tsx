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
import {
  createInquiry,
  claimFailedNotification,
  getFailedInquiryForResend,
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

    try {
      const site = await getSiteSettings();
      const notifyEmail = getContactEnv().notifyEmail ?? site.supportEmail;
      const results = await Promise.allSettled([
        sendEmail({
          to: notifyEmail,
          subject: `New inquiry for ${site.name}`,
          react: <InquiryNotification inquiry={inquiry} />,
          replyTo: inquiry.email,
        }),
        sendEmail({
          to: inquiry.email,
          subject: `Thanks for contacting ${site.name}`,
          react: <InquiryAutoReply inquiry={inquiry} />,
        }),
      ]);
      const failed = results.some((result) => result.status === "rejected");
      await setInquiryEmailStatus(inquiry.id, failed ? "failed" : "sent");
      if (failed)
        logger.error("Inquiry email delivery failed", {
          inquiryId: inquiry.id,
        });
    } catch (error) {
      logger.error("Inquiry email delivery failed", {
        inquiryId: inquiry.id,
        error,
      });
      await setInquiryEmailStatus(inquiry.id, "failed");
    }
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
    schema: z.object({ id: inquiryIdSchema }),
    permission: "inquiries:read",
    rateLimit: { key: "contact:resend", limit: 10, windowSec: 600 },
  },
  async ({ id }, { user, ip }) => {
    const inquiry = await getFailedInquiryForResend(id);
    const claim = await claimFailedNotification(id);
    if (claim.count !== 1) throw new ConflictError();
    try {
      const site = await getSiteSettings();
      await sendEmail({
        to: getContactEnv().notifyEmail ?? site.supportEmail,
        subject: `New inquiry for ${site.name}`,
        react: <InquiryNotification inquiry={inquiry} />,
        replyTo: inquiry.email,
      });
      await setInquiryEmailStatus(id, "sent");
    } catch (error) {
      await setInquiryEmailStatus(id, "failed");
      logger.error("Inquiry notification resend failed", {
        inquiryId: id,
        error,
      });
      throw new AppError(
        "CONTACT_RESEND_FAILED",
        "The notification could not be sent.",
      );
    } finally {
      revalidatePath(CONTACT_ROUTES.inquiry(id));
      revalidatePath(CONTACT_ROUTES.inquiries);
    }
    await writeAudit({
      actorId: user?.id,
      action: "inquiry.notification_resent",
      target: { type: "Inquiry", id },
      ip,
    });
    return { id };
  },
);

export async function resendInquiryNotification(input: unknown) {
  return resendAction(input);
}
