import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  assertPermission,
  assertRateLimit,
  auditCreate,
  auditUpdate,
  createUser,
  removeUser,
  revalidatePath,
  transaction,
  userFindUnique,
} = vi.hoisted(() => ({
  assertPermission: vi.fn(),
  assertRateLimit: vi.fn(),
  auditCreate: vi.fn(),
  auditUpdate: vi.fn(),
  createUser: vi.fn(),
  removeUser: vi.fn(),
  revalidatePath: vi.fn(),
  transaction: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/auth/session", () => ({
  assertPermission,
  assertUser: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit }));
vi.mock("@/lib/request", () => ({
  getClientIp: vi.fn(async () => "127.0.0.1"),
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/auth/server", () => ({
  auth: { api: { createUser, removeUser } },
}));
vi.mock("@/lib/db", () => ({
  db: {
    $transaction: transaction,
    auditLog: { create: auditCreate, update: auditUpdate },
  },
}));

import {
  banUser,
  changeRole,
  deleteUser,
  inviteUser,
  revokeUserSessions,
} from "@/modules/admin/server/actions";

beforeEach(() => {
  vi.clearAllMocks();
  assertPermission.mockResolvedValue({ id: "admin-1", role: "admin" });
  assertRateLimit.mockResolvedValue(undefined);
  auditCreate.mockResolvedValue({ id: "audit-1" });
  auditUpdate.mockResolvedValue({ id: "audit-1" });
  userFindUnique.mockResolvedValue({
    role: "user",
    email: "target@example.com",
    banned: false,
  });
  removeUser.mockResolvedValue({ success: true });
  createUser.mockResolvedValue({ user: { id: "target-1" } });
});

describe("admin audit integrity", () => {
  it("rolls back a role update when its audit insert fails", async () => {
    let storedRole = "user";
    transaction.mockImplementation(
      async (handler: (tx: unknown) => Promise<unknown>) => {
        let nextRole = storedRole;
        const result = await handler({
          $executeRaw: vi.fn(),
          user: {
            findUnique: userFindUnique,
            update: vi.fn(async ({ data }: { data: { role: string } }) => {
              nextRole = data.role;
            }),
          },
          auditLog: { create: auditCreate },
        });
        storedRole = nextRole;
        return result;
      },
    );
    auditCreate.mockRejectedValue(new Error("audit database failure"));

    const result = await changeRole({ id: "target-1", role: "staff" });

    expect(result.ok).toBe(false);
    expect(storedRole).toBe("user");
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "user.role_changed",
          targetId: "target-1",
        }),
      }),
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("does not call Better Auth deletion when the durable audit write fails", async () => {
    transaction.mockImplementation(
      async (handler: (tx: unknown) => Promise<unknown>) =>
        handler({
          $executeRaw: vi.fn(),
          user: { findUnique: userFindUnique },
        }),
    );
    auditCreate.mockRejectedValue(new Error("audit database failure"));

    const result = await deleteUser({ id: "target-1" });

    expect(result.ok).toBe(false);
    expect(removeUser).not.toHaveBeenCalled();
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "user.delete_attempted",
          targetId: "target-1",
        }),
      }),
    );
  });

  it("does not create an invited user when the durable audit write fails", async () => {
    auditCreate.mockRejectedValue(new Error("audit database failure"));

    const result = await inviteUser({
      name: "Target",
      email: "target@example.com",
      role: "staff",
    });

    expect(result.ok).toBe(false);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("rolls back a ban and session revocation if the audit insert fails", async () => {
    let banned = false;
    let sessions = 2;
    transaction.mockImplementation(
      async (handler: (tx: unknown) => Promise<unknown>) => {
        let nextBanned = banned;
        let nextSessions = sessions;
        const result = await handler({
          $executeRaw: vi.fn(),
          user: {
            findUnique: userFindUnique,
            update: vi.fn(async () => {
              nextBanned = true;
            }),
          },
          session: {
            deleteMany: vi.fn(async () => {
              nextSessions = 0;
            }),
          },
          auditLog: { create: auditCreate },
        });
        banned = nextBanned;
        sessions = nextSessions;
        return result;
      },
    );
    auditCreate.mockRejectedValue(new Error("audit database failure"));

    const result = await banUser({
      id: "target-1",
      reason: "Policy violation",
    });

    expect(result.ok).toBe(false);
    expect(banned).toBe(false);
    expect(sessions).toBe(2);
  });

  it("keeps the last admin and self-deletion protections before audit and deletion", async () => {
    userFindUnique.mockResolvedValue({
      role: "admin",
      email: "target@example.com",
      banned: false,
    });
    transaction.mockImplementation(
      async (handler: (tx: unknown) => Promise<unknown>) =>
        handler({
          $executeRaw: vi.fn(),
          user: { findUnique: userFindUnique, count: vi.fn(async () => 1) },
        }),
    );

    expect((await deleteUser({ id: "admin-1" })).ok).toBe(false);
    expect((await deleteUser({ id: "target-1" })).ok).toBe(false);
    expect(auditCreate).not.toHaveBeenCalled();
    expect(removeUser).not.toHaveBeenCalled();
  });

  it("rejects self session revocation", async () => {
    const result = await revokeUserSessions({ id: "admin-1" });

    expect(result.ok).toBe(false);
    expect(transaction).not.toHaveBeenCalled();
  });
});
