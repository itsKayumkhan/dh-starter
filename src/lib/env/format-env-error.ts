import type { ZodError, ZodIssue } from "zod";

function describeIssue(issue: ZodIssue): string {
  if (issue.code === "invalid_type")
    return issue.input === undefined ? "is missing" : "has an invalid type";
  if (issue.code === "too_small" && issue.origin === "string")
    return `must be at least ${issue.minimum} characters`;
  if (issue.code === "invalid_format") {
    if (issue.format === "url") return "must be a valid URL";
    if (issue.format === "email") return "must be a valid email address";
  }
  if (issue.code === "invalid_value") return "has an invalid value";
  if (issue.code === "custom") {
    if (issue.message === "Required for Resend")
      return "is required for Resend";
    if (issue.message === "Required for SMTP") return "is required for SMTP";
    if (issue.message === "Both Google credentials are required")
      return "must be set with GOOGLE_CLIENT_ID";
  }
  return "is invalid";
}

export function formatEnvError(
  error: ZodError,
  { source }: { source: string },
): string {
  const problems = error.issues.map((issue) => {
    const key = issue.path.map(String).join(".") || "environment";
    return `${key} ${describeIssue(issue)}`;
  });
  return `Invalid environment variables: ${problems.join(", ")}. Copy ${source} to .env and fill them in.`;
}
