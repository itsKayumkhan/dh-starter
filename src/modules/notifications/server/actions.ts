"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { safeAction } from "@/lib/safe-action";
import { NotFoundError, UnauthorizedError } from "@/lib/errors";
import { NOTIFICATION_ROUTES } from "@/modules/notifications/routes";
import {
  adminSendSchema,
  notificationIdSchema,
  type AdminSendInput,
} from "@/modules/notifications/schemas/notification";
import { notify } from "@/modules/notifications/server/notify";
import {
  getRecipientBatch,
  userExists,
} from "@/modules/notifications/server/queries";

const markReadAction = safeAction(
  { schema: notificationIdSchema },
  async (id, { user }) => {
    if (!user) throw new UnauthorizedError();
    const result = await db.notification.updateMany({
      where: { id, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    if (result.count === 0) {
      const owned = await db.notification.count({
        where: { id, userId: user.id },
      });
      if (!owned) throw new NotFoundError();
    }
    revalidatePath(NOTIFICATION_ROUTES.list);
    return { updated: result.count };
  },
);

export async function markRead(id: string) {
  return markReadAction(id);
}

const markAllReadAction = safeAction(
  { schema: z.undefined() },
  async (_input, { user }) => {
    if (!user) throw new UnauthorizedError();
    const result = await db.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath(NOTIFICATION_ROUTES.list);
    return { updated: result.count };
  },
);

export async function markAllRead() {
  return markAllReadAction(undefined);
}

const deleteNotificationAction = safeAction(
  { schema: notificationIdSchema },
  async (id, { user }) => {
    if (!user) throw new UnauthorizedError();
    const result = await db.notification.deleteMany({
      where: { id, userId: user.id },
    });
    if (result.count === 0) throw new NotFoundError();
    revalidatePath(NOTIFICATION_ROUTES.list);
    return { deleted: result.count };
  },
);

export async function deleteNotification(id: string) {
  return deleteNotificationAction(id);
}

const adminSendAction = safeAction(
  {
    schema: adminSendSchema,
    permission: "notifications:send",
    rateLimit: { key: "notifications:send", limit: 10, windowSec: 3600 },
  },
  async (input, { user, ip }) => {
    if (!user) throw new UnauthorizedError();
    const message = {
      type: "admin",
      title: input.title,
      body: input.body,
      ...(input.href ? { href: input.href } : {}),
    };
    const totals = { created: 0, emailed: 0, emailFailed: 0 };
    if (input.target === "user") {
      const recipient = await userExists(input.userId ?? "");
      if (!recipient || recipient.banned) throw new NotFoundError();
      const result = await notify(recipient.id, message, {
        email: input.email,
      });
      totals.created += result.created;
      totals.emailed += result.emailed;
      totals.emailFailed += result.emailFailed;
    } else {
      let after: string | undefined;
      for (;;) {
        const batch = await getRecipientBatch({
          ...(input.target === "role" && input.role
            ? { role: input.role }
            : {}),
          ...(after ? { after } : {}),
        });
        if (batch.length === 0) break;
        const result = await notify(
          batch.map((recipient) => recipient.id),
          message,
          {
            email: input.email,
          },
        );
        totals.created += result.created;
        totals.emailed += result.emailed;
        totals.emailFailed += result.emailFailed;
        after = batch[batch.length - 1]?.id;
        if (batch.length < 500) break;
      }
    }
    await writeAudit({
      actorId: user.id,
      action: "notification.send",
      target: {
        type: input.target,
        id:
          input.target === "user"
            ? input.userId
            : input.target === "role"
              ? input.role
              : undefined,
      },
      meta: {
        created: totals.created,
        emailed: totals.emailed,
        emailFailed: totals.emailFailed,
        email: input.email,
      },
      ip,
    });
    revalidatePath(NOTIFICATION_ROUTES.list);
    return totals;
  },
);

export async function adminSend(input: AdminSendInput) {
  return adminSendAction(input);
}
