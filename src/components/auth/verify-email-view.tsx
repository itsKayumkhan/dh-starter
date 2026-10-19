import Link from "next/link";
import { CheckCircle2, MailWarning } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

export function VerifyEmailView({
  verified,
  error,
}: {
  verified: boolean;
  error: boolean;
}) {
  if (verified && !error)
    return (
      <div className="space-y-4 text-center" role="status">
        <CheckCircle2
          className="text-primary mx-auto size-10"
          aria-hidden="true"
        />
        <h1 className="text-2xl font-semibold">Email verified</h1>
        <p className="text-muted-foreground text-sm">
          Your email is verified. You can continue to your account.
        </p>
        <Link
          href={ROUTES.dashboard}
          className="text-primary inline-block text-sm font-medium underline-offset-4 hover:underline"
        >
          Go to dashboard
        </Link>
      </div>
    );
  return (
    <div className="space-y-5">
      <div className="space-y-2 text-center">
        <MailWarning
          className="text-muted-foreground mx-auto size-10"
          aria-hidden="true"
        />
        <h1 className="text-2xl font-semibold">
          {error ? "Verification link expired" : "Check your email"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {error
            ? "The link could not be used. Request a new one below."
            : "Open the verification link we sent to finish setting up your account."}
        </p>
      </div>
      <ResendVerificationForm />
      <p className="text-center text-sm">
        <Link
          href={ROUTES.login}
          className="text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
