import { expect, test } from "@playwright/test";
import { UPLOAD_ROUTES } from "@/modules/uploads/routes";
import { hasCloudinaryE2eEnv } from "@/lib/env/test";
import { ROUTES } from "@/lib/constants/routes";

test("cross-origin upload signing is rejected", async ({ request }) => {
  const response = await request.post(UPLOAD_ROUTES.sign, {
    data: { folder: "media", bytes: 512, mimeType: "image/png" },
  });
  expect(response.status()).toBe(403);
});

test("anonymous users cannot request a signed upload", async ({
  request,
  baseURL,
}) => {
  const response = await request.post(UPLOAD_ROUTES.sign, {
    headers: { origin: new URL(baseURL ?? "http://localhost:3000").origin },
    data: { folder: "media", bytes: 512, mimeType: "image/png" },
  });
  expect(response.status()).toBe(401);
  const body: unknown = await response.json();
  expect(body).toEqual(expect.objectContaining({ error: expect.any(String) }));
});

test("staff upload, library search, copy and delete", async ({ page }) => {
  test.skip(
    !hasCloudinaryE2eEnv(),
    "Requires a configured Cloudinary test account.",
  );
  await page.goto(ROUTES.login);
  await page.getByLabel("Email").fill("staff@dhstarter.test");
  await page.getByLabel("Password").fill("DhStarter@Staff2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`${ROUTES.dashboard}$`));
  await page.goto(UPLOAD_ROUTES.media);
  await expect(
    page.getByRole("heading", { name: "Media library" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await page.getByLabel("Upload image").setInputFiles({
    name: "upload-test.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9O6yIAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.getByText("Upload complete")).toBeVisible();
  await page.getByLabel("Search media").fill("upload-test");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText("upload-test.png")).toBeVisible();
  await page.getByRole("button", { name: "Copy URL" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page
    .getByRole("button", { name: "Delete", exact: true })
    .last()
    .click();
  await expect(page.getByText("upload-test.png")).toHaveCount(0);
});
