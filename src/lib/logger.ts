type Level = "debug" | "info" | "warn" | "error";
const blocked = /password|token|secret|authorization|cookie|api.?key/i;
function redact(value: unknown): unknown {
  if (value instanceof Error) return { name: value.name };
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        blocked.test(key) ? "[REDACTED]" : redact(item),
      ]),
    );
  return value;
}
function write(
  level: Level,
  message: string,
  context?: Record<string, unknown>,
) {
  const line = JSON.stringify({
    level,
    message,
    // performance time, not new Date(): Next.js rejects the current time while prerendering, and
    // the settings fallback logs during a build without a database.
    timestamp: new Date(
      performance.timeOrigin + performance.now(),
    ).toISOString(),
    ...(redact(context ?? {}) as object),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
export const logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    write("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    write("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    write("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) =>
    write("error", message, context),
};
