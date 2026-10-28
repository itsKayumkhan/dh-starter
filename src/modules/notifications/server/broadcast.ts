import "server-only";
import { createHash } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { can } from "@/lib/auth/permissions";
import { ConflictError, ForbiddenError } from "@/lib/errors";
import type { AdminSendInput } from "@/modules/notifications/schemas/notification";

export const MAX_BROADCAST_RECIPIENTS = 200;

export function assertTargetAllowed(
  actor: { role?: string | null; banned?: boolean | null },
  input: AdminSendInput,
  recipientRole?: string,
) {
  if (
    (input.target === "all" ||
      (input.target === "role" && input.role === "admin") ||
      (input.target === "user" &&
        recipientRole !== undefined &&
        recipientRole !== "user" &&
        recipientRole !== "staff")) &&
    !can(actor, "users:write")
  )
    throw new ForbiddenError();
}

function payloadHash(input: AdminSendInput) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        target: input.target,
        userId: input.target === "user" ? input.userId : undefined,
        role: input.target === "role" ? input.role : undefined,
        title: input.title,
        body: input.body,
        href: input.href || undefined,
        email: input.email,
      }),
    )
    .digest("hex");
}

export async function getOrCreateBroadcast(
  input: AdminSendInput,
  actorId: string,
  recipients: () => Promise<string[]>,
) {
  const hash = payloadHash(input);
  let record = await db.notificationBroadcast.findUnique({
    where: { id: input.broadcastId },
  });
  let created = false;
  if (!record) {
    const recipientIds = await recipients();
    if (recipientIds.length > MAX_BROADCAST_RECIPIENTS)
      throw new ConflictError();
    try {
      record = await db.notificationBroadcast.create({
        data: {
          id: input.broadcastId,
          actorId,
          payloadHash: hash,
          recipientIds,
        },
      });
      created = true;
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      )
        throw error;
      record = await db.notificationBroadcast.findUnique({
        where: { id: input.broadcastId },
      });
    }
  }
  if (
    !record ||
    record.actorId !== actorId ||
    record.payloadHash !== hash ||
    record.recipientIds.length > MAX_BROADCAST_RECIPIENTS
  )
    throw new ConflictError();
  return { recipientIds: record.recipientIds, created };
}
