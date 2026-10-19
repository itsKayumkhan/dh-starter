import { Text } from "@react-email/components";
import { site } from "@/config/site";
import { EmailLayout } from "@/lib/email/templates/components/layout";
import type { InquiryEmailData } from "@/modules/contact/emails/inquiry-notification";

export function InquiryAutoReply({ inquiry }: { inquiry: InquiryEmailData }) {
  return (
    <EmailLayout preview={`Thanks for contacting ${site.name}`}>
      <Text style={{ fontSize: 20, fontWeight: 700 }}>Thanks for getting in touch</Text>
      <Text>Hi {inquiry.name},</Text>
      <Text>We received your message and will get back to you soon.</Text>
      <Text style={{ fontWeight: 700 }}>Your message</Text>
      <Text style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
        {inquiry.message}
      </Text>
      <Text>Reference: {inquiry.id}</Text>
    </EmailLayout>
  );
}
