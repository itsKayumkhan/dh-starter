import { logger } from "@/lib/logger";

// Next also calls register during build. NEXT_PHASE prevents a build-time process exit.
export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PHASE === "phase-production-build"
  )
    return;
  const { assertProductionRuntimeEnv } = await import("@/lib/env/server");
  try {
    assertProductionRuntimeEnv();
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "Invalid environment variables",
    );
    process.exit(1);
  }
}
