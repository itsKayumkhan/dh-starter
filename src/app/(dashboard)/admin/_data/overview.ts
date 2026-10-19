import "server-only";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";

export async function getAdminOverview() {
  await requirePermission("users:read");
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [total, newLastSevenDays, banned, unverified] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: lastWeek } } }),
    db.user.count({ where: { banned: true } }),
    db.user.count({ where: { emailVerified: false } }),
  ]);
  return { total, newLastSevenDays, banned, unverified };
}
