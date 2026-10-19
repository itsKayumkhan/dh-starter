import { z } from "zod";
import { LoginForm } from "@/components/auth/login-form";
import { sanitizeNext } from "@/components/auth/safe-redirect";
import { isGoogleAuthEnabled } from "@/lib/env/server";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Sign in", noIndex: true });

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parsed = z
    .object({
      next: z.string().optional(),
      error: z.string().max(128).optional(),
    })
    .safeParse(await searchParams);
  return (
    <LoginForm
      next={sanitizeNext(parsed.success ? parsed.data.next : undefined)}
      googleEnabled={isGoogleAuthEnabled()}
      oauthError={Boolean(parsed.success && parsed.data.error)}
    />
  );
}
