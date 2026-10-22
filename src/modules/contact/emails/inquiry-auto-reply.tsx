import { Text } from "react-email";
import { site } from "@/config/site";
import {
  EmailLayout,
  PrimaryButton,
} from "@/lib/email/templates/components/layout";
import { CONTACT_ROUTES } from "@/modules/contact/routes";
import {
  previewInquiry,
  type InquiryEmailData,
} from "@/modules/contact/emails/inquiry-notification";

export function InquiryAutoReply({ inquiry }: { inquiry: InquiryEmailData }) {
  return (
    <EmailLayout preview={`Thanks for contacting ${site.name}`}>
      <Text style={{ fontSize: 20, fontWeight: 700 }}>
        Thanks for getting in touch
      </Text>
      <Text>Hi {inquiry.name},</Text>
      <Text>We received your message and will get back to you soon.</Text>
      <Text style={{ fontWeight: 700 }}>Your message</Text>
      <Text style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
        {inquiry.message}
      </Text>
      <Text>Reference: {inquiry.id}</Text>
      <PrimaryButton
        href={new URL(CONTACT_ROUTES.contact, site.url).toString()}
      >
        Visit contact page
      </PrimaryButton>
    </EmailLayout>
  );
}
InquiryAutoReply.PreviewProps = { inquiry: previewInquiry };
