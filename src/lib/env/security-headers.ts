export function shouldSetProductionHsts(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  try {
    return new URL(process.env.BETTER_AUTH_URL ?? "").protocol === "https:";
  } catch {
    return false;
  }
}

export function shouldAllowDevelopmentEval(): boolean {
  return process.env.NODE_ENV === "development";
}
