import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ForbiddenError,
  RateLimitError,
  UnauthorizedError,
} from "@/lib/errors";
import { MESSAGES } from "@/lib/constants/messages";
import { NOTIFICATION_ROUTES } from "@/modules/notifications/routes";

const mocks = vi.hoisted(() => ({
  updateMany: vi.fn(),
  count: vi.fn(),
  deleteMany: vi.fn(),
  assertUser: vi.fn(),
  assertPermission: vi.fn(),
  assertRateLimit: vi.fn(),
  getClientIp: vi.fn(),
  revalidatePath: vi.fn(),
  writeAudit: vi.fn(),
  notify: vi.fn(),
  assertTargetAllowed: vi.fn(),
  getOrCreateBroadcast: vi.fn(),
  getBroadcastRecipients: vi.fn(),
  userExists: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    notification: {
      updateMany: mocks.updateMany,
      count: mocks.count,
      deleteMany: mocks.deleteMany,
    },
  },
}));
vi.mock("@/lib/auth/session", () => ({
  assertUser: mocks.assertUser,
  assertPermission: mocks.assertPermission,
}));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: mocks.assertRateLimit }));
vi.mock("@/lib/request", () => ({ getClientIp: mocks.getClientIp }));
vi.mock("@/lib/audit", () => ({ writeAudit: mocks.writeAudit }));
vi.mock("@/lib/logger", () => ({ logger: { error: mocks.logError } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("@/modules/notifications/server/notify", () => ({
  notify: mocks.notify,
}));
vi.mock("@/modules/notifications/server/broadcast", () => ({
  assertTargetAllowed: mocks.assertTargetAllowed,
  getOrCreateBroadcast: mocks.getOrCreateBroadcast,
  MAX_BROADCAST_RECIPIENTS: 200,
}));
vi.mock("@/modules/notifications/server/queries", () => ({
  getBroadcastRecipients: mocks.getBroadcastRecipients,
  userExists: mocks.userExists,
}));

import {
  adminSend,
  deleteNotification,
  markAllRead,
  markRead,
} from "./actions";

const id = "clx1234567890abcdef123456";
const broadcastId = "376aef70-f63a-47f9-9228-6cb84c36dcbf";
const sendInput = {
  broadcastId,
  target: "user" as const,
  userId: "recipient-1",
  title: "Update",
  body: "News",
  email: false,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.assertUser.mockResolvedValue({ id: "owner-1", role: "user" });
  mocks.assertPermission.mockResolvedValue({ id: "admin-1", role: "admin" });
  mocks.getClientIp.mockResolvedValue("127.0.0.1");
  mocks.updateMany.mockResolvedValue({ count: 1 });
  mocks.deleteMany.mockResolvedValue({ count: 1 });
  mocks.count.mockResolvedValue(0);
  mocks.getOrCreateBroadcast.mockResolvedValue({
    recipientIds: ["recipient-1"],
    created: true,
  });
  mocks.userExists.mockResolvedValue({
    id: "recipient-1",
    banned: false,
    role: "user",
  });
  mocks.notify.mockResolvedValue({ created: 1, emailed: 0, emailFailed: 0 });
});

describe("notification owner actions", () => {
  it("marks only the caller's unread notification and revalidates", async () => {
    expect(await markRead(id)).toEqual({ ok: true, data: { updated: 1 } });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id, userId: "owner-1", readAt: null },
      data: { readAt: expect.any(Date) },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith(NOTIFICATION_ROUTES.list);
  });

  it("returns a safe not-found result for another user's notification", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    expect(await markRead(id)).toEqual({ ok: false, error: MESSAGES.notFound });
    expect(mocks.count).toHaveBeenCalledWith({
      where: { id, userId: "owner-1" },
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("treats an already read notification as an idempotent success", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    mocks.count.mockResolvedValue(1);
    expect(await markRead(id)).toEqual({ ok: true, data: { updated: 0 } });
    expect(mocks.revalidatePath).toHaveBeenCalledWith(NOTIFICATION_ROUTES.list);
  });

  it("marks only the caller's notifications, including an empty result", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    expect(await markAllRead()).toEqual({ ok: true, data: { updated: 0 } });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { userId: "owner-1", readAt: null },
      data: { readAt: expect.any(Date) },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith(NOTIFICATION_ROUTES.list);
  });

  it("deletes only an owned notification", async () => {
    expect(await deleteNotification(id)).toEqual({
      ok: true,
      data: { deleted: 1 },
    });
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { id, userId: "owner-1" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith(NOTIFICATION_ROUTES.list);
  });

  it("does not delete another user's or a missing notification", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 0 });
    expect(await deleteNotification(id)).toEqual({
      ok: false,
      error: MESSAGES.notFound,
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it.each(["", "bad-id", "x".repeat(100)])(
    "rejects invalid notification ID %s",
    async (value) => {
      const result = await markRead(value);
      expect(result).toMatchObject({ ok: false, error: MESSAGES.validation });
      expect(mocks.assertUser).not.toHaveBeenCalled();
      expect(mocks.updateMany).not.toHaveBeenCalled();
    },
  );

  it("rejects a wrong-type delete ID before writing", async () => {
    const result = await deleteNotification(42 as unknown as string);
    expect(result).toMatchObject({ ok: false, error: MESSAGES.validation });
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("denies anonymous callers before database writes", async () => {
    mocks.assertUser.mockRejectedValue(new UnauthorizedError());
    expect(await markRead(id)).toEqual({
      ok: false,
      error: MESSAGES.unauthorized,
    });
    expect(await markAllRead()).toEqual({
      ok: false,
      error: MESSAGES.unauthorized,
    });
    expect(await deleteNotification(id)).toEqual({
      ok: false,
      error: MESSAGES.unauthorized,
    });
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("hides a database error and does not revalidate", async () => {
    mocks.updateMany.mockRejectedValue(new Error("private database detail"));
    expect(await markRead(id)).toEqual({ ok: false, error: MESSAGES.internal });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.logError).toHaveBeenCalled();
  });
});

describe("admin send action", () => {
  it("returns a userId field error for an ID longer than 255 characters", async () => {
    const result = await adminSend({ ...sendInput, userId: "x".repeat(256) });
    expect(result).toMatchObject({ ok: false, error: MESSAGES.validation });
    if (!result.ok) expect(result.fieldErrors?.userId).toBeDefined();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("sends to a user, audits the request, and revalidates", async () => {
    const result = await adminSend({ ...sendInput, href: "/dashboard" });
    expect(result).toEqual({
      ok: true,
      data: { created: 1, emailed: 0, emailFailed: 0, broadcastId },
    });
    expect(mocks.assertPermission).toHaveBeenCalledWith("notifications:send");
    expect(mocks.assertRateLimit).toHaveBeenCalledWith(
      "notifications:send:admin-1",
      10,
      3600,
    );
    expect(mocks.getOrCreateBroadcast).toHaveBeenCalledWith(
      { ...sendInput, href: "/dashboard" },
      "admin-1",
      expect.any(Function),
    );
    expect(mocks.userExists).toHaveBeenCalledWith("recipient-1");
    expect(mocks.notify).toHaveBeenCalledWith(
      ["recipient-1"],
      { type: "admin", title: "Update", body: "News", href: "/dashboard" },
      { email: false, broadcastId },
    );
    expect(mocks.writeAudit).toHaveBeenCalledWith({
      actorId: "admin-1",
      action: "notification.send_requested",
      target: { type: "user", id: "recipient-1" },
      meta: { recipients: 1, email: false, broadcastId, retry: false },
      ip: "127.0.0.1",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith(NOTIFICATION_ROUTES.list);
  });

  it("queries a role audience and returns zero when it is empty", async () => {
    mocks.getOrCreateBroadcast.mockImplementation(
      async (
        _input: unknown,
        _actor: unknown,
        recipients: () => Promise<string[]>,
      ) => ({ recipientIds: await recipients(), created: true }),
    );
    mocks.getBroadcastRecipients.mockResolvedValue([]);
    mocks.notify.mockResolvedValue({ created: 0, emailed: 0, emailFailed: 0 });
    const result = await adminSend({
      ...sendInput,
      target: "role",
      role: "staff",
    });
    expect(result).toMatchObject({ ok: true, data: { created: 0 } });
    expect(mocks.getBroadcastRecipients).toHaveBeenCalledWith({
      role: "staff",
      limit: 200,
    });
    expect(mocks.notify).toHaveBeenCalledWith([], expect.any(Object), {
      email: false,
      broadcastId,
    });
  });

  it("records retry status for an existing broadcast", async () => {
    mocks.getOrCreateBroadcast.mockResolvedValue({
      recipientIds: ["recipient-1"],
      created: false,
    });
    await adminSend(sendInput);
    expect(mocks.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: expect.objectContaining({ retry: true }),
      }),
    );
  });

  it.each([
    [{ ...sendInput, userId: "" }, "userId"],
    [{ ...sendInput, broadcastId: "bad" }, "broadcastId"],
    [{ ...sendInput, title: "x".repeat(161) }, "title"],
    [{ ...sendInput, body: "" }, "body"],
    [{ ...sendInput, href: "https://example.com" }, "href"],
    [{ ...sendInput, email: "yes" }, "email"],
    [{ ...sendInput, target: "role", role: undefined }, "role"],
  ])("returns a %s field error without writes", async (input, field) => {
    const result = await adminSend(input as typeof sendInput);
    expect(result).toMatchObject({ ok: false, error: MESSAGES.validation });
    if (!result.ok) expect(result.fieldErrors?.[field]).toBeDefined();
    expect(mocks.assertPermission).not.toHaveBeenCalled();
    expect(mocks.getOrCreateBroadcast).not.toHaveBeenCalled();
    expect(mocks.writeAudit).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("denies anonymous and unprivileged senders before writes", async () => {
    for (const error of [new UnauthorizedError(), new ForbiddenError()]) {
      mocks.assertPermission.mockRejectedValueOnce(error);
      expect(await adminSend(sendInput)).toEqual({
        ok: false,
        error: error.message,
      });
    }
    expect(mocks.getOrCreateBroadcast).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("denies a limited caller before writes", async () => {
    mocks.assertRateLimit.mockRejectedValue(new RateLimitError());
    expect(await adminSend(sendInput)).toEqual({
      ok: false,
      error: MESSAGES.rateLimited,
    });
    expect(mocks.getOrCreateBroadcast).not.toHaveBeenCalled();
    expect(mocks.writeAudit).not.toHaveBeenCalled();
  });

  it("does not send to a missing or banned user", async () => {
    for (const recipient of [
      null,
      { id: "recipient-1", banned: true, role: "user" },
    ]) {
      mocks.userExists.mockResolvedValueOnce(recipient);
      expect(await adminSend(sendInput)).toEqual({
        ok: false,
        error: MESSAGES.notFound,
      });
    }
    expect(mocks.writeAudit).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("hides a broadcast database failure before audit or delivery", async () => {
    mocks.getOrCreateBroadcast.mockRejectedValue(
      new Error("private database detail"),
    );
    expect(await adminSend(sendInput)).toEqual({
      ok: false,
      error: MESSAGES.internal,
    });
    expect(mocks.writeAudit).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
