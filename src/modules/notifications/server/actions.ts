"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { safeAction } from "@/lib/safe-action";
import { NotFoundError, UnauthorizedError, ConflictError } from "@/lib/errors";
import { NOTIFICATION_ROUTES } from "@/modules/notifications/routes";
import {
  adminSendSchema,
  notificationIdSchema,
  type AdminSendInput,
} from "@/modules/notifications/schemas/notification";
import { notify } from "@/modules/notifications/server/notify";
import {
  assertTargetAllowed,
  getOrCreateBroadcast,
  MAX_BROADCAST_RECIPIENTS,
} from "@/modules/notifications/server/broadcast";
import {
  getBroadcastRecipients,
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
    assertTargetAllowed(user, input);
    const broadcast = await getOrCreateBroadcast(input, user.id, async () => {
      if (input.target === "user") {
        const recipient = await userExists(input.userId ?? "");
        if (!recipient || recipient.banned) throw new NotFoundError();
        assertTargetAllowed(user, input, recipient.role);
        return [recipient.id];
      }
      const recipients = await getBroadcastRecipients({
        ...(input.target === "role" && input.role ? { role: input.role } : {}),
        limit: MAX_BROADCAST_RECIPIENTS,
      });
      if (recipients.length > MAX_BROADCAST_RECIPIENTS)
        throw new ConflictError();
      return recipients.map((recipient) => recipient.id);
    });
    if (input.target === "user") {
      const recipient = await userExists(input.userId ?? "");
      if (!recipient || recipient.banned) throw new NotFoundError();
      assertTargetAllowed(user, input, recipient.role);
    }
    const message = {
      type: "admin",
      title: input.title,
      body: input.body,
      ...(input.href ? { href: input.href } : {}),
    };
    await writeAudit({
      actorId: user.id,
      action: "notification.send_requested",
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
        recipients: broadcast.recipientIds.length,
        email: input.email,
        broadcastId: input.broadcastId,
        retry: !broadcast.created,
      },
      ip,
    });
    const totals = await notify(broadcast.recipientIds, message, {
      email: input.email,
      broadcastId: input.broadcastId,
    });
    revalidatePath(NOTIFICATION_ROUTES.list);
    return { ...totals, broadcastId: input.broadcastId };
  },
);

export async function adminSend(input: AdminSendInput) {
  return adminSendAction(input);
}
