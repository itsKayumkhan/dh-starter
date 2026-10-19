import "dotenv/config";
import { defineConfig } from "@playwright/test";
import { getTestBaseURL } from "@/lib/env/test";
const baseURL = getTestBaseURL();
export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL },
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
  },
});
