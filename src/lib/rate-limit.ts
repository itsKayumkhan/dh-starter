import "server-only";
import { db } from "@/lib/db";
import { RateLimitError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number,
) {
  if (
    !key ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    !Number.isInteger(windowSec) ||
    windowSec < 1
  )
    throw new RateLimitError();
  try {
    const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "AppRateLimit" ("id", "key", "count", "resetAt")
      VALUES (gen_random_uuid()::text, ${key}, 1, NOW() + (${windowSec} * INTERVAL '1 second'))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "AppRateLimit"."resetAt" <= NOW() THEN 1 ELSE "AppRateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "AppRateLimit"."resetAt" <= NOW() THEN NOW() + (${windowSec} * INTERVAL '1 second') ELSE "AppRateLimit"."resetAt" END
      RETURNING "count", "resetAt"`;
    const row = rows[0];
    if (!row) throw new RateLimitError();
    await db.$executeRaw`
      DELETE FROM "AppRateLimit" WHERE "id" IN (
        SELECT "id" FROM "AppRateLimit"
        WHERE "resetAt" < NOW()
        ORDER BY "resetAt"
        LIMIT 100
        FOR UPDATE SKIP LOCKED
      )`;
    return {
      allowed: row.count <= limit,
      remaining: Math.max(0, limit - row.count),
      resetAt: row.resetAt,
    };
  } catch (error) {
    logger.error("Rate limit storage failed", { error });
    throw new RateLimitError();
  }
}
export async function assertRateLimit(
  key: string,
  limit: number,
  windowSec: number,
) {
  const result = await checkRateLimit(key, limit, windowSec);
  if (!result.allowed) throw new RateLimitError();
  return result;
}
