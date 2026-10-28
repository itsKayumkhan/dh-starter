import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import { assertUser } from "@/lib/auth/session";
import { UnauthorizedError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { NOTIFICATION_MESSAGES } from "@/modules/notifications/messages";
import { getNotificationSummary } from "@/modules/notifications/server/queries";

export async function GET() {
  try {
    const user = await assertUser();
    const limit = await checkRateLimit(
      `notifications:summary:${user.id}`,
      120,
      3600,
    );
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(
              Math.max(
                1,
                Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000),
              ),
            ),
          },
        },
      );
    }
    const summary = await getNotificationSummary(user.id);
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    // Let Next control-flow errors (redirect, 403, request-time bailout) pass through.
    unstable_rethrow(error);
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
    logger.error("Notification summary failed", { error });
    return NextResponse.json(
      { error: NOTIFICATION_MESSAGES.unavailable },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
