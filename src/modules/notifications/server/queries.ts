import "server-only";
import { db } from "@/lib/db";
import { z } from "zod";

const userIdSchema = z.string().min(1).max(255);
const listOptionsSchema = z.object({
  skip: z.number().int().min(0),
  take: z.number().int().min(1).max(100),
  status: z.enum(["all", "read", "unread"]),
});

const fields = {
  id: true,
  type: true,
  title: true,
  body: true,
  href: true,
  readAt: true,
  createdAt: true,
} as const;

function toDto(row: {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export type NotificationDto = ReturnType<typeof toDto>;

export async function getUnreadCount(userId: string) {
  return db.notification.count({
    where: { userId: userIdSchema.parse(userId), readAt: null },
  });
}

export async function getNotificationSummary(userId: string) {
  const id = userIdSchema.parse(userId);
  const [unread, latest] = await Promise.all([
    getUnreadCount(id),
    db.notification.findMany({
      where: { userId: id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5,
      select: fields,
    }),
  ]);
  return { unread, latest: latest.map(toDto) };
}

export async function listNotifications(
  userId: string,
  options: { skip: number; take: number; status: "all" | "read" | "unread" },
) {
  const id = userIdSchema.parse(userId);
  const parsed = listOptionsSchema.parse(options);
  const where = {
    userId: id,
    ...(parsed.status === "unread"
      ? { readAt: null }
      : parsed.status === "read"
        ? { readAt: { not: null } }
        : {}),
  };
  const [rows, total] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: parsed.skip,
      take: parsed.take,
      select: fields,
    }),
    db.notification.count({ where }),
  ]);
  return { items: rows.map(toDto), total };
}

export async function getBroadcastRecipients(input: {
  role?: "user" | "staff" | "admin";
  limit: number;
}) {
  return db.user.findMany({
    where: { banned: false, ...(input.role ? { role: input.role } : {}) },
    orderBy: { id: "asc" },
    take: input.limit + 1,
    select: { id: true },
  });
}

export async function userExists(userId: string) {
  return db.user.findUnique({
    where: { id: userIdSchema.parse(userId) },
    select: { id: true, banned: true, role: true },
  });
}
