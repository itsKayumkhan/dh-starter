import { expect, test, type Page } from "@playwright/test";
import { connect } from "node:net";
import { z } from "zod";
import { contentRegistry } from "@/config/content";
import { getTestBaseURL } from "@/lib/env/test";
import { CMS_ROUTES } from "@/modules/cms/routes";
import { ROUTES } from "@/lib/constants/routes";

async function hasLocalCmsE2ESetup() {
  const host = new URL(getTestBaseURL()).hostname;
  const database = z.url().safeParse(process.env.DATABASE_URL);
  if (!database.success || (host !== "localhost" && host !== "127.0.0.1"))
    return false;
  const url = new URL(database.data);
  return new Promise<boolean>((resolve) => {
    const socket = connect({
      host: url.hostname,
      port: Number(url.port || 5432),
    });
    socket.setTimeout(1000);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

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

test("admin edits public hero and restores its default", async ({ page }) => {
  test.skip(
    !(await hasLocalCmsE2ESetup()),
    "Requires a reachable local seeded database.",
  );
  await signIn(page, "admin");
  await page.goto(CMS_ROUTES.block("home.hero"));
  const title = page.getByLabel("Title", { exact: true });
  try {
    await title.fill("A CMS edited home title");
    await page.getByRole("button", { name: "Save block" }).click();
    await expect(page.getByText("Content saved")).toBeVisible();
    await page.goto(ROUTES.home);
    await expect(
      page.getByRole("heading", { name: "A CMS edited home title" }),
    ).toBeVisible();
  } finally {
    await page.goto(CMS_ROUTES.block("home.hero"));
    await page.getByRole("button", { name: "Reset to default" }).click();
    await expect(page.getByText("Default content restored")).toBeVisible();
    await page.goto(ROUTES.home);
    await expect(
      page.getByRole("heading", {
        name: contentRegistry["home.hero"].defaultValue.title,
      }),
    ).toBeVisible();
  }
});

test("staff can edit content but cannot open site settings", async ({
  page,
}) => {
  test.skip(
    !(await hasLocalCmsE2ESetup()),
    "Requires a reachable local seeded database.",
  );
  await signIn(page, "staff");
  await page.goto(CMS_ROUTES.block("home.hero"));
  await expect(page.getByRole("heading", { name: "Hero" })).toBeVisible();
  await page.getByLabel("Title", { exact: true }).fill("Staff edited title");
  await page.getByRole("button", { name: "Save block" }).click();
  await expect(page.getByText("Content saved")).toBeVisible();
  await page.getByRole("button", { name: "Reset to default" }).click();
  await expect(page.getByText("Default content restored")).toBeVisible();
  await page.goto(CMS_ROUTES.settings);
  await expect(page.getByText("Access denied", { exact: true })).toBeVisible();
});

test("regular user sees the 403 page", async ({ page }) => {
  test.skip(
    !(await hasLocalCmsE2ESetup()),
    "Requires a reachable local seeded database.",
  );
  await signIn(page, "user");
  await page.goto(CMS_ROUTES.content);
  await expect(page.getByText("Access denied", { exact: true })).toBeVisible();
});
