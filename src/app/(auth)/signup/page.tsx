import { SignupForm } from "@/components/shared/signup-form";
import { MESSAGES } from "@/lib/constants/messages";
export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6">
      <h1 className="mb-6 text-3xl font-semibold">{MESSAGES.createAccount}</h1>
      <SignupForm />
    </main>
  );
}
