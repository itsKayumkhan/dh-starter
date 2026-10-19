import { SignupForm } from "@/components/auth/signup-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Create account",
  noIndex: true,
});
export default function SignupPage() {
  return <SignupForm />;
}
