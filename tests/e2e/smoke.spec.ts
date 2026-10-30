import { test, expect } from "./fixtures";
import { ROUTES } from "@/lib/constants/routes";
test("landing and sign in navigation", async ({ page }) => {
  await page.goto(ROUTES.home);
  await expect(
    page.getByRole("heading", { name: /solid start/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`${ROUTES.login}$`));
});

test("the font set in the root layout is applied (any font)", async ({
  page,
}) => {
  await page.goto(ROUTES.home);
  const { variable, body } = await page.evaluate(() => ({
    variable: getComputedStyle(document.documentElement)
      .getPropertyValue("--font-sans")
      .trim(),
    body: getComputedStyle(document.body).fontFamily,
  }));
  // Design-neutral: only checks the layout font variable is wired to the page, never which font it is.
  expect(variable).not.toBe("");
  const firstFamily = variable.split(",")[0]?.replace(/["']/g, "").trim() ?? "";
  expect(body.replace(/["']/g, "")).toContain(firstFamily);
});
