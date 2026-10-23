import { Text } from "react-email";
import type { SiteSettings } from "@/config/settings";
import {
  EmailLayout,
  PrimaryButton,
} from "@/lib/email/templates/components/layout";
export function ResetPassword({
  name,
  url,
  settings,
}: {
  name: string;
  url: string;
  settings?: SiteSettings;
}) {
  return (
    <EmailLayout preview="Reset your password" settings={settings}>
      <Text>Hello {name},</Text>
      <Text>
        Use this link to reset your password. Ignore this email if you did not
        request it.
      </Text>
      <PrimaryButton href={url} settings={settings}>
        Reset password
      </PrimaryButton>
    </EmailLayout>
  );
}
ResetPassword.PreviewProps = { name: "Alex", url: "https://example.com/reset" };
export default ResetPassword;
