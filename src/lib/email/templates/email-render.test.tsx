import { describe, expect, it } from "vitest";
import { render } from "react-email";
import { settingsDefaults } from "@/config/settings";
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
    ctaUrl: new URL(ROUTES.dashboard, settingsDefaults.url).toString(),
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
  it("renders the edited brand during sendEmail rendering", async () => {
    const brand = {
      ...settingsDefaults,
      name: "Edited Brand",
      address: "Edited Address",
      email: {
        ...settingsDefaults.email,
        fontFamily: "Georgia, serif",
        backgroundColor: "#fafafa",
        textColor: "#234567",
        borderColor: "#345678",
        headerColor: "#456789",
        footerColor: "#56789a",
        footerMutedColor: "#6789ab",
        buttonBackgroundColor: "#123456",
        buttonTextColor: "#ffffff",
        buttonRadius: 12,
      },
    };
    const html = await render(<Welcome name="Alex" settings={brand} />);
    expect(html).toContain("Edited Brand");
    expect(html).toContain("Edited Address");
    expect(html).toContain("#123456");
    expect(html).toContain("Georgia, serif");
    expect(html).toContain("#fafafa");
    expect(html).toContain("#234567");
    expect(html).toContain("#456789");
    expect(html).toContain("#56789a");
    expect(html).toContain("#6789ab");
    expect(html).toMatch(/border-radius:\s*12px/);
  });
});
