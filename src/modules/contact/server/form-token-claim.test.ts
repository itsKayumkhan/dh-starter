import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { createFormToken, isFormTokenReady, MAX_AGE_MS } from "./form-token";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  deleteMany: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: { contactFormTokenClaim: mocks },
}));

import { claimFormToken } from "./form-token-claim";

describe("single-use contact form token", () => {
  beforeEach(() => {
    mocks.create.mockReset();
    mocks.deleteMany.mockReset();
    mocks.deleteMany.mockResolvedValue({ count: 0 });
  });

  it("accepts one valid claim and rejects a concurrent replay", async () => {
    const claimed = new Set<string>();
    mocks.create.mockImplementation(
      async ({ data }: { data: { tokenHash: string } }) => {
        if (claimed.has(data.tokenHash))
          throw new Prisma.PrismaClientKnownRequestError("duplicate", {
            code: "P2002",
            clientVersion: "7.10.1",
          });
        claimed.add(data.tokenHash);
        return data;
      },
    );
    const token = createFormToken("secret", Date.now() - 3_000);
    expect(isFormTokenReady(token, "secret")).toBe(true);
    expect(
      await Promise.all([claimFormToken(token), claimFormToken(token)]),
    ).toEqual([true, false]);
    expect(mocks.create).toHaveBeenCalledTimes(2);
  });

  it("expires tokens after fifteen minutes", () => {
    const now = 1_760_000_000_000;
    const token = createFormToken("secret", now);
    expect(isFormTokenReady(token, "secret", now + MAX_AGE_MS)).toBe(true);
    expect(isFormTokenReady(token, "secret", now + MAX_AGE_MS + 1)).toBe(false);
  });
});
