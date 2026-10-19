import { Text } from "@react-email/components";
import { EmailLayout } from "@/lib/email/templates/components/layout";
export function Welcome({ name }: { name: string }) {
  return (
    <EmailLayout preview="Welcome">
      <Text>Hello {name}, welcome aboard.</Text>
    </EmailLayout>
  );
}
Welcome.PreviewProps = { name: "Alex" };
export default Welcome;
