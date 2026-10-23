import { Text } from "react-email";
import type { SiteSettings } from "@/config/settings";
import {
  EmailLayout,
  PrimaryButton,
} from "@/lib/email/templates/components/layout";
export function Notification({
  title,
  body,
  url,
  cta,
  settings,
}: {
  title: string;
  body: string;
  url?: string;
  cta?: string;
  settings?: SiteSettings;
}) {
  return (
    <EmailLayout preview={title} settings={settings}>
      <Text style={{ fontSize: 20, fontWeight: 700 }}>{title}</Text>
      <Text>{body}</Text>
      {url && cta ? (
        <PrimaryButton href={url} settings={settings}>
          {cta}
        </PrimaryButton>
      ) : null}
    </EmailLayout>
  );
}
Notification.PreviewProps = {
  title: "Update",
  body: "You have a new update.",
  url: "https://example.com",
  cta: "View update",
};
export default Notification;
