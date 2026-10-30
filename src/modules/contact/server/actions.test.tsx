import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ForbiddenError,
  RateLimitError,
  UnauthorizedError,
} from "@/lib/errors";
import { MESSAGES } from "@/lib/constants/messages";

const mocks = vi.hoisted(() => ({
  assertPermission: vi.fn(),
  assertUser: vi.fn(),
  assertRateLimit: vi.fn(),
  getClientIp: vi.fn(),
  headers: vi.fn(),
  revalidatePath: vi.fn(),
  loggerError: vi.fn(),
  isFormTokenReady: vi.fn(),
  claimFormToken: vi.fn(),
  getSiteSettings: vi.fn(),
  getContactEnv: vi.fn(),
  getServerEnv: vi.fn(),
  sendEmail: vi.fn(),
  create: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  auditCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("@/lib/auth/session", () => ({
  assertPermission: mocks.assertPermission,
  assertUser: mocks.assertUser,
}));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: mocks.assertRateLimit }));
vi.mock("@/lib/request", () => ({ getClientIp: mocks.getClientIp }));
vi.mock("@/lib/logger", () => ({ logger: { error: mocks.loggerError } }));
vi.mock("@/lib/db", () => ({
  db: {
    $transaction: mocks.transaction,
    inquiry: {
      create: mocks.create,
      findUnique: mocks.findUnique,
      update: mocks.update,
      updateMany: mocks.updateMany,
    },
    auditLog: { create: mocks.auditCreate },
  },
}));
vi.mock("@/lib/content/settings", () => ({
  getSiteSettings: mocks.getSiteSettings,
}));
vi.mock("@/lib/email", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/env/server", () => ({ getServerEnv: mocks.getServerEnv }));
vi.mock("@/modules/contact/env", () => ({
  getContactEnv: mocks.getContactEnv,
}));
vi.mock("@/modules/contact/server/form-token", () => ({
  isFormTokenReady: mocks.isFormTokenReady,
}));
vi.mock("@/modules/contact/server/form-token-claim", () => ({
  claimFormToken: mocks.claimFormToken,
}));

import {
  changeInquiryStatus,
  resendInquiryEmail,
  submitInquiry,
} from "./actions";

const inquiry = {
  id: "inquiry-1",
  name: "Taylor Smith",
  email: "taylor@example.com",
  phone: null,
  subject: null,
  message: "Please contact me about a project.",
  source: "/contact",
  status: "new",
  notificationEmailStatus: "failed",
  autoReplyEmailStatus: "failed",
  ip: "203.0.113.4",
  userAgent: "Test browser",
  createdAt: new Date("2026-10-28T00:00:00.000Z"),
  updatedAt: new Date("2026-10-28T00:00:00.000Z"),
};

const submission = {
  name: "  Taylor Smith  ",
  email: "taylor@example.com",
  message: "Please contact me about a project.",
  source: "/contact",
  website: "",
  formToken: "signed-token",
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.assertPermission.mockResolvedValue({ id: "admin-1", role: "admin" });
  mocks.assertRateLimit.mockResolvedValue(undefined);
  mocks.getClientIp.mockResolvedValue("203.0.113.4");
  mocks.headers.mockResolvedValue(
    new Headers({ "user-agent": "Test browser" }),
  );
  mocks.isFormTokenReady.mockReturnValue(true);
  mocks.claimFormToken.mockResolvedValue(true);
  mocks.getServerEnv.mockReturnValue({ BETTER_AUTH_SECRET: "test-secret" });
  mocks.getContactEnv.mockReturnValue({ notifyEmail: undefined });
  mocks.getSiteSettings.mockResolvedValue({
    name: "Starter",
    supportEmail: "support@example.com",
  });
  mocks.sendEmail.mockResolvedValue(undefined);
  mocks.create.mockResolvedValue(inquiry);
  mocks.findUnique.mockResolvedValue(inquiry);
  mocks.update.mockResolvedValue(inquiry);
  mocks.updateMany.mockResolvedValue({ count: 1 });
  mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  // The transaction client exposes the same mocked tables; a throw inside rejects the transaction.
  mocks.transaction.mockImplementation(
    async (run: (tx: unknown) => Promise<unknown>) =>
      run({
        inquiry: { findUnique: mocks.findUnique, update: mocks.update },
        auditLog: { create: mocks.auditCreate },
      }),
  );
});

function expectNoWrites() {
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.updateMany).not.toHaveBeenCalled();
  expect(mocks.auditCreate).not.toHaveBeenCalled();
  expect(mocks.sendEmail).not.toHaveBeenCalled();
  expect(mocks.revalidatePath).not.toHaveBeenCalled();
}

describe("submitInquiry", () => {
  it("creates an inquiry, sends both emails, records delivery and invalidates the list", async () => {
    const result = await submitInquiry(submission);
    expect(result).toEqual({ ok: true, data: { id: "inquiry-1" } });
    expect(mocks.assertPermission).not.toHaveBeenCalled();
    expect(mocks.assertUser).not.toHaveBeenCalled();
    expect(mocks.assertRateLimit).toHaveBeenCalledWith(
      "contact:submit:203.0.113.4",
      5,
      600,
    );
    expect(mocks.isFormTokenReady).toHaveBeenCalledWith(
      "signed-token",
      "test-secret",
    );
    expect(mocks.claimFormToken).toHaveBeenCalledWith("signed-token");
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: "Taylor Smith",
          email: "taylor@example.com",
          phone: null,
          subject: null,
          message: submission.message,
          source: "/contact",
          ip: "203.0.113.4",
          userAgent: "Test browser",
        },
      }),
    );
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "support@example.com",
        subject: "New inquiry for Starter",
        replyTo: inquiry.email,
      }),
    );
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: inquiry.email,
        subject: "Thanks for contacting Starter",
      }),
    );
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "inquiry-1" },
      data: { notificationEmailStatus: "sent" },
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "inquiry-1" },
      data: { autoReplyEmailStatus: "sent" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledExactlyOnceWith(
      "/admin/inquiries",
    );
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["missing name", { name: undefined }, "name"],
    ["bad email", { email: "not-an-email" }, "email"],
    ["wrong message type", { message: 42 }, "message"],
    ["short message", { message: "short" }, "message"],
    ["long message", { message: "x".repeat(5001) }, "message"],
    ["external source", { source: "//other.test" }, "source"],
    ["missing token", { formToken: "" }, "formToken"],
  ])(
    "rejects %s with field errors and no writes",
    async (_name, change, field) => {
      const result = await submitInquiry({ ...submission, ...change });
      expect(result).toMatchObject({ ok: false, error: MESSAGES.validation });
      if (result.ok) throw new Error("Expected validation failure");
      expect(result.fieldErrors?.[field]).toBeDefined();
      expect(mocks.assertRateLimit).not.toHaveBeenCalled();
      expectNoWrites();
    },
  );

  it.each([
    ["honeypot", { website: "bot" }, true],
    ["unready token", {}, false],
  ])(
    "rejects the %s before claiming or creating",
    async (_name, change, ready) => {
      mocks.isFormTokenReady.mockReturnValue(ready);
      const result = await submitInquiry({ ...submission, ...change });
      expect(result).toEqual({
        ok: false,
        error: "Please refresh the form and try again.",
      });
      expect(mocks.claimFormToken).not.toHaveBeenCalled();
      expectNoWrites();
    },
  );

  it("rejects a replayed token without creating another inquiry", async () => {
    mocks.claimFormToken.mockResolvedValue(false);
    expect(await submitInquiry(submission)).toEqual({
      ok: false,
      error: "Please refresh the form and try again.",
    });
    expectNoWrites();
  });

  it("rejects a denied public rate limit before claiming the token", async () => {
    mocks.assertRateLimit.mockRejectedValue(new RateLimitError());
    expect(await submitInquiry(submission)).toEqual({
      ok: false,
      error: MESSAGES.rateLimited,
    });
    expect(mocks.claimFormToken).not.toHaveBeenCalled();
    expectNoWrites();
  });

  it("returns a generic error when inquiry creation throws", async () => {
    mocks.create.mockRejectedValue(new Error("database secret"));
    expect(await submitInquiry(submission)).toEqual({
      ok: false,
      error: MESSAGES.internal,
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("records a failed notification and still confirms the saved inquiry", async () => {
    mocks.sendEmail.mockRejectedValueOnce(new Error("provider secret"));
    expect(await submitInquiry(submission)).toEqual({
      ok: true,
      data: { id: "inquiry-1" },
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "inquiry-1" },
      data: { notificationEmailStatus: "failed" },
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "inquiry-1" },
      data: { autoReplyEmailStatus: "sent" },
    });
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "Inquiry email delivery failed",
      expect.objectContaining({
        inquiryId: "inquiry-1",
        channel: "notification",
      }),
    );
  });

  it("confirms the saved inquiry when the delivery status write fails, so the visitor does not resubmit", async () => {
    mocks.update.mockRejectedValue(new Error("database secret"));
    expect(await submitInquiry(submission)).toEqual({
      ok: true,
      data: { id: "inquiry-1" },
    });
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "Inquiry email status write failed",
      expect.objectContaining({ inquiryId: "inquiry-1" }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/inquiries");
  });
});

describe("changeInquiryStatus", () => {
  const input = { id: "inquiry-1", status: "closed" };

  it("updates status, revalidates both pages and audits the prior status", async () => {
    const result = await changeInquiryStatus(input);
    expect(result).toEqual({ ok: true, data: { status: "closed" } });
    expect(mocks.assertPermission).toHaveBeenCalledWith("inquiries:read");
    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { id: "inquiry-1" },
      select: { status: true },
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "inquiry-1" },
      data: { status: "closed" },
    });
    expect(mocks.revalidatePath.mock.calls.map(([path]) => path)).toEqual([
      "/admin/inquiries",
      "/admin/inquiries/inquiry-1",
    ]);
    expect(mocks.auditCreate).toHaveBeenCalledWith({
      data: {
        actorId: "admin-1",
        action: "inquiry.status_changed",
        targetType: "Inquiry",
        targetId: "inquiry-1",
        meta: { previous: "new", status: "closed" },
        ip: "203.0.113.4",
      },
    });
  });

  it.each([
    ["missing id", { status: "closed" }, "id"],
    ["malformed id", { id: "bad/id", status: "closed" }, "id"],
    ["long id", { id: "x".repeat(65), status: "closed" }, "id"],
    ["wrong id type", { id: 12, status: "closed" }, "id"],
    ["missing status", { id: "inquiry-1" }, "status"],
    ["invalid status", { id: "inquiry-1", status: "deleted" }, "status"],
    ["wrong status type", { id: "inquiry-1", status: 3 }, "status"],
  ])("rejects %s before auth or writes", async (_name, badInput, field) => {
    const result = await changeInquiryStatus(badInput);
    expect(result).toMatchObject({ ok: false, error: MESSAGES.validation });
    if (result.ok) throw new Error("Expected validation failure");
    expect(result.fieldErrors?.[field]).toBeDefined();
    expect(mocks.assertPermission).not.toHaveBeenCalled();
    expectNoWrites();
  });

  it.each([
    ["anonymous", new UnauthorizedError()],
    ["without permission", new ForbiddenError()],
  ])("denies %s callers without reading or writing", async (_name, error) => {
    mocks.assertPermission.mockRejectedValue(error);
    expect(await changeInquiryStatus(input)).toEqual({
      ok: false,
      error: error.message,
    });
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expectNoWrites();
  });

  it("returns not found without writing when the inquiry is absent", async () => {
    mocks.findUnique.mockResolvedValue(null);
    expect(await changeInquiryStatus(input)).toEqual({
      ok: false,
      error: MESSAGES.notFound,
    });
    expectNoWrites();
  });

  it("hides a database read failure and does not write", async () => {
    mocks.findUnique.mockRejectedValue(new Error("database secret"));
    expect(await changeInquiryStatus(input)).toEqual({
      ok: false,
      error: MESSAGES.internal,
    });
    expectNoWrites();
  });

  it("does not write, audit or revalidate when the inquiry already has the requested status", async () => {
    expect(
      await changeInquiryStatus({ id: "inquiry-1", status: "new" }),
    ).toEqual({ ok: true, data: { status: "new" } });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("writes the status and the audit entry in one transaction, failing both when the audit fails", async () => {
    mocks.auditCreate.mockRejectedValue(new Error("database secret"));
    expect(await changeInquiryStatus(input)).toEqual({
      ok: false,
      error: MESSAGES.internal,
    });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("resendInquiryEmail", () => {
  const input = { id: "inquiry-1", channel: "notification" };

  it.each([
    ["notification", "support@example.com", "New inquiry for Starter"],
    ["autoReply", inquiry.email, "Thanks for contacting Starter"],
  ])("claims and resends the %s channel once", async (channel, to, subject) => {
    const result = await resendInquiryEmail({ ...input, channel });
    expect(result).toEqual({ ok: true, data: { id: "inquiry-1" } });
    expect(mocks.assertPermission).toHaveBeenCalledWith("inquiries:read");
    expect(mocks.assertRateLimit).toHaveBeenCalledWith(
      "contact:resend:admin-1",
      10,
      600,
    );
    expect(mocks.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "inquiry-1" } }),
    );
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "inquiry-1", [`${channel}EmailStatus`]: "failed" },
      data: { [`${channel}EmailStatus`]: "pending" },
    });
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to, subject }),
    );
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "inquiry-1" },
      data: { [`${channel}EmailStatus`]: "sent" },
    });
    expect(mocks.revalidatePath.mock.calls.map(([path]) => path)).toEqual([
      "/admin/inquiries/inquiry-1",
      "/admin/inquiries",
    ]);
    expect(mocks.auditCreate).toHaveBeenCalledWith({
      data: {
        actorId: "admin-1",
        action: "inquiry.email_resent",
        targetType: "Inquiry",
        targetId: "inquiry-1",
        meta: { channel },
        ip: "203.0.113.4",
      },
    });
  });

  it.each([
    ["missing id", { channel: "notification" }, "id"],
    ["malformed id", { id: "bad/id", channel: "notification" }, "id"],
    ["long id", { id: "x".repeat(65), channel: "notification" }, "id"],
    ["wrong id type", { id: 3, channel: "notification" }, "id"],
    ["missing channel", { id: "inquiry-1" }, "channel"],
    ["invalid channel", { id: "inquiry-1", channel: "other" }, "channel"],
    ["wrong channel type", { id: "inquiry-1", channel: 3 }, "channel"],
  ])(
    "rejects %s with field errors and no writes",
    async (_name, badInput, field) => {
      const result = await resendInquiryEmail(badInput);
      expect(result).toMatchObject({ ok: false, error: MESSAGES.validation });
      if (result.ok) throw new Error("Expected validation failure");
      expect(result.fieldErrors?.[field]).toBeDefined();
      expect(mocks.assertPermission).not.toHaveBeenCalled();
      expectNoWrites();
    },
  );

  it.each([
    ["anonymous", new UnauthorizedError()],
    ["without permission", new ForbiddenError()],
  ])("denies %s callers before reading or writing", async (_name, error) => {
    mocks.assertPermission.mockRejectedValue(error);
    expect(await resendInquiryEmail(input)).toEqual({
      ok: false,
      error: error.message,
    });
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expectNoWrites();
  });

  it("rejects a denied resend rate limit before reading or claiming", async () => {
    mocks.assertRateLimit.mockRejectedValue(new RateLimitError());
    expect(await resendInquiryEmail(input)).toEqual({
      ok: false,
      error: MESSAGES.rateLimited,
    });
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expectNoWrites();
  });

  it("returns not found without a claim when the inquiry is absent", async () => {
    mocks.findUnique.mockResolvedValue(null);
    expect(await resendInquiryEmail(input)).toEqual({
      ok: false,
      error: MESSAGES.notFound,
    });
    expectNoWrites();
  });

  it("rejects duplicate resends when the failed status cannot be claimed", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    expect(await resendInquiryEmail(input)).toEqual({
      ok: false,
      error: MESSAGES.conflict,
    });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("restores failed status and hides a provider error", async () => {
    mocks.sendEmail.mockRejectedValue(new Error("provider secret"));
    expect(await resendInquiryEmail(input)).toEqual({
      ok: false,
      error: "The email could not be sent.",
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "inquiry-1" },
      data: { notificationEmailStatus: "failed" },
    });
    expect(mocks.auditCreate).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(2);
  });

  it("hides a database claim error without sending email", async () => {
    mocks.updateMany.mockRejectedValue(new Error("database secret"));
    expect(await resendInquiryEmail(input)).toEqual({
      ok: false,
      error: MESSAGES.internal,
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });
});
