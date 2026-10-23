import { Text } from "react-email";
import { site } from "@/config/site";
import type { SiteSettings } from "@/config/settings";
import { ROUTES } from "@/lib/constants/routes";
import {
  EmailLayout,
  PrimaryButton,
} from "@/lib/email/templates/components/layout";
export function Welcome({
  name,
  settings = site,
}: {
  name: string;
  settings?: SiteSettings;
}) {
  return (
    <EmailLayout preview="Welcome" settings={settings}>
      <Text>Hello {name}, welcome aboard.</Text>
      <PrimaryButton
        href={new URL(ROUTES.dashboard, settings.url).toString()}
        settings={settings}
      >
        Open dashboard
      </PrimaryButton>
    </EmailLayout>
  );
}
Welcome.PreviewProps = { name: "Alex" };
export default Welcome;
