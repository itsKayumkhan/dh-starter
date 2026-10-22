import { Text } from "react-email";
import {
  EmailLayout,
  PrimaryButton,
} from "@/lib/email/templates/components/layout";
export function ResetPassword({ name, url }: { name: string; url: string }) {
  return (
    <EmailLayout preview="Reset your password">
      <Text>Hello {name},</Text>
      <Text>
        Use this link to reset your password. Ignore this email if you did not
        request it.
      </Text>
      <PrimaryButton href={url}>Reset password</PrimaryButton>
    </EmailLayout>
  );
}
ResetPassword.PreviewProps = { name: "Alex", url: "https://example.com/reset" };
export default ResetPassword;
