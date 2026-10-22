import type { ReactElement } from "react";
import { render } from "react-email";
import { expect } from "vitest";
import { site } from "@/config/site";

/** Shared email assertions so core and module template tests check the same rules. */
export async function expectBrandedEmail(
  element: ReactElement,
  ctaUrl: string,
) {
  const html = await render(element);
  const plainText = await render(element, { plainText: true });

  expect(html).toContain(site.name);
  expect(html).toContain(`href="${ctaUrl}"`);
  expect(html).toMatch(/<table\b/i);
  expect(html).toMatch(/max-width:\s*600px/i);
  expect(html).not.toMatch(/<link\b[^>]*rel=["']?stylesheet/i);
  expect(html).not.toMatch(/<script\b/i);
  expect(plainText.trim()).not.toBe("");
  expect(plainText).toContain(site.name);
}
