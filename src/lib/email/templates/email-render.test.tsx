import { describe, it } from "vitest";
import { site } from "@/config/site";
import { ROUTES } from "@/lib/constants/routes";
import { InviteUser } from "@/lib/email/templates/invite-user";
import { Notification } from "@/lib/email/templates/notification";
import { ResetPassword } from "@/lib/email/templates/reset-password";
import { VerifyEmail } from "@/lib/email/templates/verify-email";
import { Welcome } from "@/lib/email/templates/welcome";
import { expectBrandedEmail } from "@/lib/email/templates/test-utils";

const templates = [
  {
    name: "verify email",
    element: <VerifyEmail {...VerifyEmail.PreviewProps} />,
    ctaUrl: VerifyEmail.PreviewProps.url,
  },
  {
    name: "reset password",
    element: <ResetPassword {...ResetPassword.PreviewProps} />,
    ctaUrl: ResetPassword.PreviewProps.url,
  },
  {
    name: "welcome",
    element: <Welcome {...Welcome.PreviewProps} />,
    ctaUrl: new URL(ROUTES.dashboard, site.url).toString(),
  },
  {
    name: "invite user",
    element: <InviteUser {...InviteUser.PreviewProps} />,
    ctaUrl: InviteUser.PreviewProps.url,
  },
  {
    name: "notification",
    element: <Notification {...Notification.PreviewProps} />,
    ctaUrl: Notification.PreviewProps.url,
  },
];

describe("core email templates", () => {
  for (const { name, element, ctaUrl } of templates) {
    it(`renders ${name} as self-contained branded HTML and plain text`, async () => {
      await expectBrandedEmail(element, ctaUrl);
    });
  }
});
