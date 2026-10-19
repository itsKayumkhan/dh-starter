import { test, expect } from "@playwright/test";
import { ROUTES } from "@/lib/constants/routes";
test("landing and sign in navigation", async ({ page }) => {
  await page.goto(ROUTES.home);
  await expect(
    page.getByRole("heading", { name: /solid start/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`${ROUTES.login}$`));
});
