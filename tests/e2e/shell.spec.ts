import { expect, test } from "./fixtures";
import { ROUTES } from "@/lib/constants/routes";
import { AUTH_ROUTES } from "@/components/auth/routes";

test("protected shell redirects signed-out visitors", async ({ page }) => {
  await page.goto(ROUTES.dashboard);
  await expect(page).toHaveURL(
    new RegExp(`${ROUTES.login.replace("/", "\\/")}(\\?|$)`),
  );
  await page.goto(ROUTES.admin);
  await expect(page).toHaveURL(
    new RegExp(`${ROUTES.login.replace("/", "\\/")}(\\?|$)`),
  );
});

test("seeded admin can navigate dashboard shell and admin overview", async ({
  page,
}) => {
  await page.goto(ROUTES.login);
  await page
    .getByRole("textbox", { name: "Email" })
    .fill("admin@dhstarter.test");
  await page.getByLabel("Password").fill("DhStarter@Admin2026");
  async function signIn() {
    const response = page.waitForResponse(
      (result) =>
        new URL(result.url()).pathname.startsWith(ROUTES.authApi) &&
        result.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Sign in" }).click();
    return response;
  }
  let signInResponse = await signIn();
  if (signInResponse.status() === 429) {
    // Better Auth allows three sign-ins per IP in ten seconds. Other E2E tests share localhost.
    const retryAfter = Number(signInResponse.headers()["x-retry-after"] ?? 10);
    await page.waitForTimeout((Math.max(1, retryAfter) + 1) * 1000);
    signInResponse = await signIn();
  }
  expect(signInResponse.status()).toBe(200);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.dashboard}$`));
  await expect(
    page.getByRole("heading", { name: /welcome back/i }),
  ).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Navigate" })).toBeVisible();
  await page
    .getByRole("dialog", { name: "Navigate" })
    .getByText("Account")
    .click();
  await expect(page).toHaveURL(new RegExp(`${AUTH_ROUTES.account}$`));
  await page.goto(ROUTES.admin);
  await expect(
    page.getByRole("heading", { name: "Admin overview" }),
  ).toBeVisible();
  await expect(page.getByText("Total users")).toBeVisible();
});
