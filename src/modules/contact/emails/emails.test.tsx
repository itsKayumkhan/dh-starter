import { describe, it } from "vitest";
import { site } from "@/config/site";
import { expectBrandedEmail } from "@/lib/email/templates/test-utils";
import { InquiryAutoReply } from "@/modules/contact/emails/inquiry-auto-reply";
import { InquiryNotification } from "@/modules/contact/emails/inquiry-notification";
import { CONTACT_ROUTES } from "@/modules/contact/routes";

describe("contact email templates", () => {
  it("renders the inquiry notification as branded HTML and plain text", async () => {
    const { inquiry } = InquiryNotification.PreviewProps;
    await expectBrandedEmail(
      <InquiryNotification {...InquiryNotification.PreviewProps} />,
      new URL(CONTACT_ROUTES.inquiry(inquiry.id), site.url).toString(),
    );
  });

  it("renders the inquiry auto reply as branded HTML and plain text", async () => {
    await expectBrandedEmail(
      <InquiryAutoReply {...InquiryAutoReply.PreviewProps} />,
      new URL(CONTACT_ROUTES.contact, site.url).toString(),
    );
  });
});
