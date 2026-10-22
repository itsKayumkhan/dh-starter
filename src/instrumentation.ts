// Next also calls register during build. NEXT_PHASE prevents a build-time process exit.
export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PHASE === "phase-production-build"
  )
    return;
  const { checkProductionEnvOrExit } = await import("@/instrumentation-node");
  checkProductionEnvOrExit();
}
