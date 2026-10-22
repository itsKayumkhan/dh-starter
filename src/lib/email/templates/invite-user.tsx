import { Text } from "react-email";
import {
  EmailLayout,
  PrimaryButton,
} from "@/lib/email/templates/components/layout";
export function InviteUser({ name, url }: { name: string; url: string }) {
  return (
    <EmailLayout preview="You are invited">
      <Text>Hello {name}, you have been invited to join.</Text>
      <PrimaryButton href={url}>Accept invitation</PrimaryButton>
    </EmailLayout>
  );
}
InviteUser.PreviewProps = { name: "Alex", url: "https://example.com/invite" };
export default InviteUser;
