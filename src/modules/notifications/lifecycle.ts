import "server-only";
import { db } from "@/lib/db";

export async function onUserDelete(userId: string): Promise<void> {
  const broadcasts = await db.notificationBroadcast.findMany({
    where: { recipientIds: { has: userId }, actorId: { not: userId } },
    select: { id: true, recipientIds: true },
  });
  await db.$transaction([
    db.notification.deleteMany({ where: { userId } }),
    db.notificationBroadcast.deleteMany({ where: { actorId: userId } }),
    ...broadcasts.map((broadcast) =>
      db.notificationBroadcast.update({
        where: { id: broadcast.id },
        data: {
          recipientIds: broadcast.recipientIds.filter((id) => id !== userId),
        },
      }),
    ),
  ]);
}
