import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ update: vi.fn(), updateMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { inquiry: mocks } }));

import { claimFailedEmail, setInquiryEmailStatus } from "./inquiries";

describe("inquiry email channels", () => {
  beforeEach(() => {
    mocks.update.mockReset();
    mocks.updateMany.mockReset();
  });

  it("claims and updates only the failed auto-reply", async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });
    await claimFailedEmail("inquiry-1", "autoReply");
    await setInquiryEmailStatus("inquiry-1", "autoReply", "sent");
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "inquiry-1", autoReplyEmailStatus: "failed" },
      data: { autoReplyEmailStatus: "pending" },
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "inquiry-1" },
      data: { autoReplyEmailStatus: "sent" },
    });
  });
});
