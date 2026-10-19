import { expect, test } from "@playwright/test";
import { ROUTES } from "@/lib/constants/routes";
import { getBillingE2EConfig } from "@/modules/billing/env";
import { billingPlans, isConfiguredPrice } from "@/modules/billing/plans";
import { BILLING_ROUTES } from "@/modules/billing/routes";

const e2e = getBillingE2EConfig();
const hasPrice = isConfiguredPrice(billingPlans[0].stripePriceId);

test("signed-in customer can start subscription checkout", async ({ page }) => {
  test.skip(!e2e.success || !hasPrice, "Needs Stripe test keys, a configured test price and BILLING_E2E_EMAIL/BILLING_E2E_PASSWORD for a seeded user.");
  if (!e2e.success) return;
  await page.goto(BILLING_ROUTES.pricing);
  await expect(page.getByRole("heading", { name: "Choose your plan" })).toBeVisible();
  await page.goto(ROUTES.login);
  await page.getByLabel("Email").fill(e2e.data.BILLING_E2E_EMAIL);
  await page.getByLabel("Password").fill(e2e.data.BILLING_E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`${ROUTES.dashboard}$`));
  await page.goto(BILLING_ROUTES.pricing);
  await page.getByRole("button", { name: `Choose ${billingPlans[0].name}` }).click();
  await expect(page).toHaveURL(/https:\/\/checkout\.stripe\.com\//);
});
