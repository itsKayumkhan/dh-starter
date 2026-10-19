import { expect, test } from "@playwright/test";
import { ROUTES } from "@/lib/constants/routes";
import { AUTH_ROUTES } from "@/components/auth/routes";

test("protected shell redirects signed-out visitors", async ({ page }) => {
  await page.goto(ROUTES.dashboard);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.login.replace("/", "\\/")}(\\?|$)`));
  await page.goto(ROUTES.admin);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.login.replace("/", "\\/")}(\\?|$)`));
});

test("seeded admin can navigate dashboard shell and admin overview", async ({ page }) => {
  await page.goto(ROUTES.login);
  await page.getByRole("textbox", { name: "Email" }).fill("admin@dhstarter.test");
  await page.getByLabel("Password").fill("DhStarter@Admin2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  const loginError = page.getByRole("alert");
  await expect.poll(async () => {
    if (await loginError.isVisible()) return "error";
    return page.url().endsWith(ROUTES.dashboard) ? "dashboard" : "pending";
  }, { timeout: 10000 }).not.toBe("pending");
  if (await loginError.isVisible()) {
    test.skip(true, "Requires a migrated and seeded local database with the demo admin login");
  }
  await expect(page).toHaveURL(new RegExp(`${ROUTES.dashboard}$`));
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Navigate" })).toBeVisible();
  await page.getByRole("dialog", { name: "Navigate" }).getByText("Account").click();
  await expect(page).toHaveURL(new RegExp(`${AUTH_ROUTES.account}$`));
  await page.goto(ROUTES.admin);
  await expect(page.getByRole("heading", { name: "Admin overview" })).toBeVisible();
  await expect(page.getByText("Total users")).toBeVisible();
});
