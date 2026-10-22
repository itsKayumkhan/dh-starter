import { Text } from "react-email";
import { site } from "@/config/site";
import { ROUTES } from "@/lib/constants/routes";
import {
  EmailLayout,
  PrimaryButton,
} from "@/lib/email/templates/components/layout";
export function Welcome({ name }: { name: string }) {
  return (
    <EmailLayout preview="Welcome">
      <Text>Hello {name}, welcome aboard.</Text>
      <PrimaryButton href={new URL(ROUTES.dashboard, site.url).toString()}>
        Open dashboard
      </PrimaryButton>
    </EmailLayout>
  );
}
Welcome.PreviewProps = { name: "Alex" };
export default Welcome;
