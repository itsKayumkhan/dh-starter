import { logger } from "@/lib/logger";
import { assertProductionRuntimeEnv } from "@/lib/env/server";

// Node-only boot check, imported from instrumentation.ts so the Edge bundle never sees process.exit.
export function checkProductionEnvOrExit() {
  try {
    assertProductionRuntimeEnv();
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "Invalid environment variables",
    );
    process.exit(1);
  }
}
