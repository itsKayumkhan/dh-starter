import { Text } from "@react-email/components";
import {
  EmailLayout,
  PrimaryButton,
} from "@/lib/email/templates/components/layout";
export function VerifyEmail({ name, url }: { name: string; url: string }) {
  return (
    <EmailLayout preview="Verify your email">
      <Text>Hello {name},</Text>
      <Text>Confirm your email address to finish setting up your account.</Text>
      <PrimaryButton href={url}>Verify email</PrimaryButton>
    </EmailLayout>
  );
}
VerifyEmail.PreviewProps = { name: "Alex", url: "https://example.com/verify" };
export default VerifyEmail;
