import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { getSession } from "@/lib/auth/session";

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
  const sessions = await auth.api.listSessions({ headers: await headers() });
  return sessions.map((session) => ({
    id: session.id,
    device: session.userAgent?.slice(0, 160) || "Unknown device",
    ip: session.ipAddress || "Unknown IP",
    lastActive: session.updatedAt.toISOString(),
    current: session.id === current.session.id,
  }));
}
