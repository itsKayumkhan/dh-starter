import "dotenv/config";
import { defineConfig } from "@playwright/test";
import { getTestBaseURL } from "@/lib/env/test";
const baseURL = getTestBaseURL();
export default defineConfig({
  testDir: "tests/e2e",
  // next dev compiles each route on first visit, so allow more than the 5s default.
  expect: { timeout: 15_000 },
  use: { baseURL },
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
  },
});
