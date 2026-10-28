import "server-only";
import { logger } from "@/lib/logger";

export async function runUserDeleteHooks(userId: string): Promise<void> {
  try {
    const { userDeleteHooks } = await import("@/config/module-lifecycle");
    for (const hook of userDeleteHooks) await hook(userId);
  } catch (error) {
    logger.error("User deletion cleanup failed", { error });
    throw error;
  }
}
