import "server-only";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export type AccountSession = {
  id: string;
  device: string;
  ip: string;
  lastActive: string;
  current: boolean;
};

export async function getAccountSessions(): Promise<AccountSession[]> {
  const current = await getSession();
  if (!current) return [];
  const sessions = await db.session.findMany({
    where: { userId: current.user.id, expiresAt: { gt: new Date() } },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, userAgent: true, ipAddress: true, updatedAt: true },
  });
  return sessions.map((session) => ({
    id: session.id,
    device: session.userAgent?.slice(0, 160) || "Unknown device",
    ip: session.ipAddress || "Unknown IP",
    lastActive: session.updatedAt.toISOString(),
    current: session.id === current.session.id,
  }));
}
