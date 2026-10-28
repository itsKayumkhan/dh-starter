import { Text } from "react-email";
import type { SiteSettings } from "@/config/settings";
import {
  EmailLayout,
  PrimaryButton,
} from "@/lib/email/templates/components/layout";

export function DeleteAccountEmail({
  name,
  url,
  settings,
}: {
  name: string;
  url: string;
  settings?: SiteSettings;
}) {
  return (
    <EmailLayout preview="Confirm account deletion" settings={settings}>
      <Text>Hello {name},</Text>
      <Text>
        Confirm this request to permanently delete your account. If you did not
        request deletion, ignore this email.
      </Text>
      <PrimaryButton href={url} settings={settings}>
        Confirm deletion
      </PrimaryButton>
    </EmailLayout>
  );
}
