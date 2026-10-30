import { test as base } from "@playwright/test";
import { resetRateLimits } from "./rate-limits";

export { expect, type Page } from "@playwright/test";

/** Every spec imports `test` from here: rate-limit counters are reset before each test. */
export const test = base.extend<{ freshRateLimits: void }>({
  freshRateLimits: [
    async ({}, use) => {
      await resetRateLimits();
      await use();
    },
    { auto: true },
  ],
});
