import { expect, test } from "@playwright/test";
import { hasLocalAdminE2ESetup } from "@/modules/admin/env";
import { ADMIN_ROUTES } from "@/modules/admin/routes";
import { ROUTES } from "@/lib/constants/routes";

test("admin can review users and audit history", async ({ page }) => {
  test.skip(
    !hasLocalAdminE2ESetup(),
    "Requires a local database seeded with the development admin account.",
  );
  await page.goto(ROUTES.login);
  await page.getByLabel("Email").fill("admin@dhstarter.test");
  await page.getByLabel("Password").fill("DhStarter@Admin2026");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => url.pathname.startsWith(ROUTES.dashboard));
  await page.goto(ADMIN_ROUTES.users);
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Invite user" })).toBeVisible();
  await page
    .getByRole("link", { name: /admin@dhstarter.test/i })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Active sessions/ }),
  ).toBeVisible();
  await page.goto(ADMIN_ROUTES.audit);
  await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
});
