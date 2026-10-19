import { z } from "zod";
import { VerifyEmailView } from "@/components/auth/verify-email-view";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Verify email", noIndex: true });

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parsed = z
    .object({
      verified: z.literal("1").optional(),
      error: z.string().max(128).optional(),
    })
    .safeParse(await searchParams);
  return (
    <VerifyEmailView
      verified={Boolean(parsed.success && parsed.data.verified)}
      error={Boolean(parsed.success && parsed.data.error)}
    />
  );
}
