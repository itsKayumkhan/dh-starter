import { expect, test } from "@playwright/test";
import { hasContactE2EEnv } from "@/modules/contact/env";
import { CONTACT_ROUTES } from "@/modules/contact/routes";

test("visitor sends a contact inquiry", async ({ page }) => {
  test.skip(
    !hasContactE2EEnv(),
    "Requires DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL and EMAIL_FROM with a running database.",
  );
  await page.goto(CONTACT_ROUTES.contact);
  await expect(page.getByRole("heading", { name: "Contact us" })).toBeVisible();
  await page.getByLabel("Name").fill("Contact Test");
  await page.getByLabel("Email").fill(`contact-${Date.now()}@example.test`);
  await page.getByLabel("Subject (optional)").fill("Project question");
  await page.getByLabel("Message").fill("I would like to discuss a new project with your team.");
  await page.waitForTimeout(3100);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Thanks, your inquiry has been received." })).toBeVisible();
});
