import { z } from "zod";

export function getTestBaseURL() {
  return z
    .url()
    .parse(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
}

/** DATABASE_URL only when it points at a local database, otherwise null (e2e never touches a remote DB). */
export function getLocalTestDatabaseUrl() {
  const parsed = z.url().safeParse(process.env.DATABASE_URL);
  if (!parsed.success) return null;
  const url = new URL(parsed.data);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) return null;
  if (!["localhost", "127.0.0.1"].includes(url.hostname)) return null;
  if (
    [...url.searchParams].some(
      ([key, value]) => key !== "sslmode" || value !== "disable",
    )
  )
    return null;
  return parsed.data;
}

export function requireLocalE2ESetup() {
  const appHost = new URL(getTestBaseURL()).hostname;
  const databaseUrl = getLocalTestDatabaseUrl();
  if (!["localhost", "127.0.0.1"].includes(appHost) || !databaseUrl)
    throw new Error(
      "E2E requires a localhost app and a local database (DATABASE_URL on localhost).",
    );
  return databaseUrl;
}

export function hasCloudinaryE2eEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );
}

export function hasContactE2eTransport() {
  if (process.env.CONTACT_E2E_DELIVERY !== "1") return false;
  return process.env.EMAIL_PROVIDER === "resend"
    ? Boolean(process.env.RESEND_API_KEY)
    : process.env.EMAIL_PROVIDER === "smtp"
      ? Boolean(process.env.SMTP_HOST)
      : false;
}
