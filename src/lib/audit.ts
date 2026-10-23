import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export async function writeAudit(
  input: {
    actorId?: string | null;
    action: string;
    target: { type: string; id?: string | null };
    meta?: Prisma.InputJsonValue;
    ip?: string | null;
  },
  client: Prisma.TransactionClient | typeof db = db,
) {
  return client.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.target.type,
      targetId: input.target.id,
      meta: input.meta ?? {},
      ip: input.ip,
    },
  });
}
