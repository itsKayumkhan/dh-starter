import { expect, test } from "@playwright/test";
import { UPLOAD_ROUTES } from "@/modules/uploads/routes";

test("anonymous users cannot request a signed upload", async ({ request }) => {
  const response = await request.post(UPLOAD_ROUTES.sign, {
    data: { folder: "media", bytes: 512, mimeType: "image/png" },
  });
  expect(response.status()).toBe(401);
  const body: unknown = await response.json();
  expect(body).toEqual(expect.objectContaining({ error: expect.any(String) }));
});

test("staff upload, library search, copy and delete", async ({ page }) => {
  test.skip(
    true,
    "Requires a seeded staff session, database migration, and configured Cloudinary account.",
  );
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
