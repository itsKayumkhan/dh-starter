import { Text } from "react-email";
import type { SiteSettings } from "@/config/settings";
import {
  EmailLayout,
  PrimaryButton,
} from "@/lib/email/templates/components/layout";
export function InviteUser({
  name,
  url,
  settings,
}: {
  name: string;
  url: string;
  settings?: SiteSettings;
}) {
  return (
    <EmailLayout preview="You are invited" settings={settings}>
      <Text>Hello {name}, you have been invited to join.</Text>
      <PrimaryButton href={url} settings={settings}>
        Accept invitation
      </PrimaryButton>
    </EmailLayout>
  );
}
InviteUser.PreviewProps = { name: "Alex", url: "https://example.com/invite" };
export default InviteUser;
