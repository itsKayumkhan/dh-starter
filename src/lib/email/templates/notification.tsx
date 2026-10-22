import { Text } from "react-email";
import {
  EmailLayout,
  PrimaryButton,
} from "@/lib/email/templates/components/layout";
export function Notification({
  title,
  body,
  url,
  cta,
}: {
  title: string;
  body: string;
  url?: string;
  cta?: string;
}) {
  return (
    <EmailLayout preview={title}>
      <Text style={{ fontSize: 20, fontWeight: 700 }}>{title}</Text>
      <Text>{body}</Text>
      {url && cta ? <PrimaryButton href={url}>{cta}</PrimaryButton> : null}
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
