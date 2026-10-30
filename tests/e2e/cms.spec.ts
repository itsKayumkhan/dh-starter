import { expect, test, type Page } from "./fixtures";
import { contentRegistry } from "@/config/content";
import { CMS_ROUTES } from "@/modules/cms/routes";
import { ROUTES } from "@/lib/constants/routes";
import {
  withContentBlockSnapshot,
  type ContentBlockSnapshot,
} from "../../scripts/cms-snapshot";

async function signIn(page: Page, role: "admin" | "staff" | "user") {
  await page.goto(ROUTES.login);
  await page
    .getByRole("textbox", { name: "Email" })
    .fill(`${role}@dhstarter.test`);
  await page
    .getByLabel("Password")
    .fill(`DhStarter@${role[0].toUpperCase()}${role.slice(1)}2026`);
  async function submit() {
    const response = page.waitForResponse(
      (result) =>
        new URL(result.url()).pathname.startsWith(ROUTES.authApi) &&
        result.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Sign in" }).click();
    return response;
  }
  let response = await submit();
  if (response.status() === 429) {
    await page.waitForTimeout(
      (Number(response.headers()["x-retry-after"] ?? 10) + 1) * 1000,
    );
    response = await submit();
  }
  expect(response.status()).toBe(200);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.dashboard}$`));
}

async function restoreHeroInEditor(page: Page, original: ContentBlockSnapshot) {
  await page.goto(CMS_ROUTES.block("home.hero"));
  if (original) {
    const title = (original.value as { title: string }).title;
    await page.getByLabel("Title", { exact: true }).fill(title);
    await page.getByRole("button", { name: "Save block" }).click();
    await expect(page.getByText("Content saved")).toBeVisible();
  } else {
    await page.getByRole("button", { name: "Reset to default" }).click();
    await expect(page.getByText("Default content restored")).toBeVisible();
  }
  await page.goto(ROUTES.home);
  await expect(
    page.getByRole("heading", {
      name: original
        ? (original.value as { title: string }).title
        : contentRegistry["home.hero"].defaultValue.title,
    }),
  ).toBeVisible();
}

test("admin edits public hero and restores its exact prior content", async ({
  page,
}) => {
  await withContentBlockSnapshot("home.hero", async (original) => {
    await signIn(page, "admin");
    try {
      await page.goto(CMS_ROUTES.block("home.hero"));
      await page
        .getByLabel("Title", { exact: true })
        .fill("A CMS edited home title");
      await page.getByRole("button", { name: "Save block" }).click();
      await expect(page.getByText("Content saved")).toBeVisible();
      await page.goto(ROUTES.home);
      await expect(
        page.getByRole("heading", { name: "A CMS edited home title" }),
      ).toBeVisible();
    } finally {
      await restoreHeroInEditor(page, original);
    }
  });
});

test("staff can edit content but cannot open site settings", async ({
  page,
}) => {
  await withContentBlockSnapshot("home.hero", async (original) => {
    await signIn(page, "staff");
    try {
      await page.goto(CMS_ROUTES.block("home.hero"));
      await expect(page.getByRole("heading", { name: "Hero" })).toBeVisible();
      await page
        .getByLabel("Title", { exact: true })
        .fill("Staff edited title");
      await page.getByRole("button", { name: "Save block" }).click();
      await expect(page.getByText("Content saved")).toBeVisible();
      await page.goto(CMS_ROUTES.settings);
      await expect(
        page.getByText("Access denied", { exact: true }),
      ).toBeVisible();
    } finally {
      await restoreHeroInEditor(page, original);
    }
  });
});

test("regular user sees the 403 page", async ({ page }) => {
  await signIn(page, "user");
  await page.goto(CMS_ROUTES.content);
  await expect(page.getByText("Access denied", { exact: true })).toBeVisible();
});
