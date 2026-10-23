import { Text } from "react-email";
import type { SiteSettings } from "@/config/settings";
import {
  EmailLayout,
  PrimaryButton,
} from "@/lib/email/templates/components/layout";
export function VerifyEmail({
  name,
  url,
  settings,
}: {
  name: string;
  url: string;
  settings?: SiteSettings;
}) {
  return (
    <EmailLayout preview="Verify your email" settings={settings}>
      <Text>Hello {name},</Text>
      <Text>Confirm your email address to finish setting up your account.</Text>
      <PrimaryButton href={url} settings={settings}>
        Verify email
      </PrimaryButton>
    </EmailLayout>
  );
}
VerifyEmail.PreviewProps = { name: "Alex", url: "https://example.com/verify" };
export default VerifyEmail;
