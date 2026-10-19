import { z } from "zod";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Reset password",
  noIndex: true,
});

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parsed = z
    .object({
      token: z.string().min(1).max(512).optional(),
      error: z.string().max(128).optional(),
    })
    .safeParse(await searchParams);
  return (
    <ResetPasswordForm
      token={parsed.success ? parsed.data.token : undefined}
      invalid={Boolean(parsed.success && parsed.data.error)}
    />
  );
}
