import "server-only";
import { revalidatePath } from "next/cache";
import { createElement } from "react";
import { z } from "zod";
import { getSiteSettings } from "@/lib/content/settings";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { Notification } from "@/lib/email/templates/notification";
import { logger } from "@/lib/logger";
import { NOTIFICATION_ROUTES } from "@/modules/notifications/routes";
import { notificationInputSchema } from "@/modules/notifications/schemas/notification";

const userIdsSchema = z.union([
  z.string().min(1).max(255),
  z.array(z.string().min(1).max(255)).max(200),
]);
const optionsSchema = z
  .object({ email: z.boolean().optional(), broadcastId: z.uuid().optional() })
  .optional();

export async function notify(
  userIds: string | string[],
  input: { type: string; title: string; body: string; href?: string },
  opts?: { email?: boolean; broadcastId?: string },
): Promise<{ created: number; emailed: number; emailFailed: number }> {
  const ids = [...new Set([userIdsSchema.parse(userIds)].flat())];
  const data = notificationInputSchema.parse(input);
  const options = optionsSchema.parse(opts);
  if (ids.length === 0) return { created: 0, emailed: 0, emailFailed: 0 };

  let created = 0;
  let emailed = 0;
  let emailFailed = 0;
  const site = options?.email ? await getSiteSettings() : null;
  for (let offset = 0; offset < ids.length; offset += 50) {
    const recipients = await db.user.findMany({
      where: { id: { in: ids.slice(offset, offset + 50) }, banned: false },
      select: { id: true, email: true },
    });
    if (recipients.length === 0) continue;
    const inserted = await db.notification.createManyAndReturn({
      data: recipients.map((recipient) => ({
        userId: recipient.id,
        ...data,
        ...(options?.broadcastId ? { broadcastId: options.broadcastId } : {}),
      })),
      skipDuplicates: Boolean(options?.broadcastId),
      select: { userId: true },
    });
    created += inserted.length;
    if (options?.email) {
      const insertedIds = new Set(inserted.map((item) => item.userId));
      const emailRecipients = recipients.filter((item) =>
        insertedIds.has(item.id),
      );
      for (
        let emailOffset = 0;
        emailOffset < emailRecipients.length;
        emailOffset += 10
      ) {
        const results = await Promise.allSettled(
          emailRecipients
            .slice(emailOffset, emailOffset + 10)
            .map((recipient) =>
              sendEmail({
                to: recipient.email,
                subject: data.title,
                react: createElement(Notification, {
                  title: data.title,
                  body: data.body,
                  ...(data.href
                    ? {
                        url: new URL(data.href, site?.url).toString(),
                        cta: "View notification",
                      }
                    : {}),
                }),
              }),
            ),
        );
        for (const result of results) {
          if (result.status === "fulfilled") emailed += 1;
          else {
            emailFailed += 1;
            logger.error("Notification email failed", { error: result.reason });
          }
        }
      }
    }
  }
  if (created) revalidatePath(NOTIFICATION_ROUTES.list);
  return { created, emailed, emailFailed };
}
