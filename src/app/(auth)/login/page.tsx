import { LoginForm } from "@/components/shared/login-form";
import { z } from "zod";
import { MESSAGES } from "@/lib/constants/messages";
import { safeReturnPath } from "@/lib/return-path";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const candidate = z
    .object({ next: z.string().optional() })
    .safeParse(await searchParams).data?.next;
  const next = safeReturnPath(candidate);
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6">
      <h1 className="mb-6 text-3xl font-semibold">{MESSAGES.signIn}</h1>
      <LoginForm next={next} />
    </main>
  );
}
