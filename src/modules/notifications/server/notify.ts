import "server-only";
import { revalidatePath } from "next/cache";
import { createElement } from "react";
import { z } from "zod";
import { site } from "@/config/site";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { Notification } from "@/lib/email/templates/notification";
import { logger } from "@/lib/logger";
import { NOTIFICATION_ROUTES } from "@/modules/notifications/routes";
import { notificationInputSchema } from "@/modules/notifications/schemas/notification";

const userIdsSchema = z.union([
  z.string().min(1).max(255),
  z.array(z.string().min(1).max(255)).max(100_000),
]);
const optionsSchema = z.object({ email: z.boolean().optional() }).optional();

export async function notify(
  userIds: string | string[],
  input: { type: string; title: string; body: string; href?: string },
  opts?: { email?: boolean },
): Promise<{ created: number; emailed: number; emailFailed: number }> {
  const ids = [...new Set([userIdsSchema.parse(userIds)].flat())];
  const data = notificationInputSchema.parse(input);
  const options = optionsSchema.parse(opts);
  if (ids.length === 0) return { created: 0, emailed: 0, emailFailed: 0 };

  let created = 0;
  let emailed = 0;
  let emailFailed = 0;
  for (let offset = 0; offset < ids.length; offset += 500) {
    const recipients = await db.user.findMany({
      where: { id: { in: ids.slice(offset, offset + 500) }, banned: false },
      select: { id: true, email: true },
    });
    if (recipients.length === 0) continue;
    const result = await db.notification.createMany({
      data: recipients.map((recipient) => ({ userId: recipient.id, ...data })),
    });
    created += result.count;
    if (options?.email) {
      for (const recipient of recipients) {
        try {
          await sendEmail({
            to: recipient.email,
            subject: data.title,
            react: createElement(Notification, {
              title: data.title,
              body: data.body,
              ...(data.href
                ? {
                    url: new URL(data.href, site.url).toString(),
                    cta: "View notification",
                  }
                : {}),
            }),
          });
          emailed += 1;
        } catch (error) {
          emailFailed += 1;
          logger.error("Notification email failed", { error });
        }
      }
    }
  }
  if (created) revalidatePath(NOTIFICATION_ROUTES.list);
  return { created, emailed, emailFailed };
}
