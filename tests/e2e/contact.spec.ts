import { expect, test } from "@playwright/test";
import { hasContactE2EEnv } from "@/modules/contact/env";
import { CONTACT_ROUTES } from "@/modules/contact/routes";
import { hasContactE2eTransport } from "@/lib/env/test";

test("visitor sends a contact inquiry", async ({ page }) => {
  test.skip(
    !hasContactE2EEnv() || !hasContactE2eTransport(),
    "Requires seeded local database, configured Resend or SMTP test delivery, and CONTACT_E2E_DELIVERY=1.",
  );
  await page.goto(CONTACT_ROUTES.contact);
  await expect(page.getByRole("heading", { name: "Contact us" })).toBeVisible();
  await page.getByLabel("Name").fill("Contact Test");
  await page.getByLabel("Email").fill(`contact-${Date.now()}@example.test`);
  await page.getByLabel("Subject (optional)").fill("Project question");
  await page
    .getByLabel("Message")
    .fill("I would like to discuss a new project with your team.");
  await page.waitForTimeout(3100);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Thanks, your inquiry has been received." }),
  ).toBeVisible();
});
