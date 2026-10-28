import { expect, test } from "@playwright/test";
import { ROUTES } from "@/lib/constants/routes";
import { AUTH_ROUTES } from "@/components/auth/routes";

test("signup validates required fields and password confirmation", async ({
  page,
}) => {
  await page.goto(ROUTES.signup);
  await expect(
    page.getByRole("heading", { name: "Create account" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter at least 2 characters")).toBeVisible();
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Password123");
  await page.getByLabel("Confirm password").fill("OtherPassword123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Passwords do not match")).toBeVisible();
});

test("password recovery shows a neutral completion state", async ({ page }) => {
  await page.goto(AUTH_ROUTES.forgotPassword);
  await expect(
    page.getByRole("heading", { name: "Reset your password" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await page.getByLabel("Email").fill("unknown@example.test");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page.getByText(
      "If an account exists for this email, a reset link is on its way.",
    ),
  ).toBeVisible();
});

test("verified seeded user signs in and opens account management", async ({
  page,
}) => {
  await page.goto(ROUTES.login);
  await page.getByLabel("Email").fill("user@dhstarter.test");
  await page.getByLabel("Password").fill("DhStarter@User2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`${ROUTES.dashboard}$`));
  await page.goto(ROUTES.account);
  await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue("user@dhstarter.test");
});
