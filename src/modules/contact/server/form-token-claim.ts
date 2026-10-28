import "server-only";
import { createHash } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { MAX_AGE_MS } from "@/modules/contact/server/form-token";

export async function claimFormToken(token: string): Promise<boolean> {
  const now = new Date();
  await db.contactFormTokenClaim.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  try {
    await db.contactFormTokenClaim.create({
      data: {
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Number(token.slice(0, 13)) + MAX_AGE_MS),
      },
    });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return false;
    throw error;
  }
}
