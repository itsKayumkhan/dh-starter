import { expect, test } from "@playwright/test";
import { getNotificationsE2ePrerequisites } from "@/modules/notifications/env";
import { NOTIFICATION_ROUTES } from "@/modules/notifications/routes";
import { ROUTES } from "@/lib/constants/routes";

const prerequisites = getNotificationsE2ePrerequisites();
test.skip(
  !prerequisites.DATABASE_URL || !prerequisites.BETTER_AUTH_URL,
  "Requires a database, Better Auth, and seeded test users.",
);

test("staff sends an in-app notification to users", async ({ page }) => {
  const title = `Notification test ${Date.now()}`;
  await page.goto(ROUTES.login);
  await page.getByLabel("Email").fill("staff@dhstarter.test");
  await page.getByLabel("Password").fill("DhStarter@Staff2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`${ROUTES.dashboard}`));

  await page.goto(NOTIFICATION_ROUTES.list);
  await expect(
    page.getByRole("heading", { name: "Notifications" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Unread" }).click();
  await expect(page).toHaveURL(/status=unread/);

  await page.goto(NOTIFICATION_ROUTES.send);
  await expect(
    page.getByRole("heading", { name: "Send notification" }),
  ).toBeVisible();
  await page.getByLabel("Recipients").click();
  await page.getByRole("option", { name: "A role" }).click();
  await page.getByLabel("Role").click();
  await page.getByRole("option", { name: "User", exact: true }).click();
  await page.getByLabel("Title").fill(title);
  await page
    .getByLabel("Message")
    .fill("An update from the notifications e2e test.");
  await page.getByRole("button", { name: "Send notification" }).click();
  await expect(page.getByText(/notification[s]? created/)).toBeVisible();

  await page.context().clearCookies();
  await page.goto(ROUTES.login);
  await page.getByLabel("Email").fill("user@dhstarter.test");
  await page.getByLabel("Password").fill("DhStarter@User2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`${ROUTES.dashboard}`));
  await page.goto(NOTIFICATION_ROUTES.list);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const notification = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: title }) });
  await notification.getByRole("button", { name: "Mark as read" }).click();
  await expect(
    notification.getByRole("button", { name: "Mark as read" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Read", exact: true }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await notification.getByRole("button", { name: "Delete" }).click();
  const deletion = page.waitForResponse((response) =>
    new URL(response.url()).pathname === NOTIFICATION_ROUTES.list && response.request().method() === "POST",
  );
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete" })
    .click();
  await deletion;
  await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
  // Let the post-delete refresh settle before Playwright closes this browser context.
  await page.waitForLoadState("networkidle");
});
