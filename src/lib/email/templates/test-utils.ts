import type { ReactElement } from "react";
import { render } from "react-email";
import { expect } from "vitest";
import { settingsDefaults } from "@/config/settings";

/** Shared email assertions so core and module template tests check the same rules. */
export async function expectBrandedEmail(
  element: ReactElement,
  ctaUrl: string,
) {
  const html = await render(element);
  const plainText = await render(element, { plainText: true });

  expect(html).toContain(settingsDefaults.name);
  expect(html).toContain(`href="${ctaUrl}"`);
  expect(html).toMatch(/<table\b/i);
  expect(html).not.toMatch(/<link\b[^>]*rel=["']?stylesheet/i);
  expect(html).not.toMatch(/<script\b/i);
  expect(plainText.trim()).not.toBe("");
  expect(plainText).toContain(settingsDefaults.name);
}
