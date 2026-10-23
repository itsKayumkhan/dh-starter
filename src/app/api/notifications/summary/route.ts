import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import { assertUser } from "@/lib/auth/session";
import { UnauthorizedError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { NOTIFICATION_MESSAGES } from "@/modules/notifications/messages";
import { getNotificationSummary } from "@/modules/notifications/server/queries";

export async function GET() {
  try {
    const user = await assertUser();
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
