import { describe, expect, it, vi } from "vitest";

const settings = vi.hoisted(() => ({
  value: { name: "Edited site", url: "https://edited.test" },
}));
vi.mock("@/lib/content/settings", () => ({
  getSiteSettings: async () => settings.value,
}));
vi.mock("@/lib/seo", () => ({
  buildMetadata: (_input: unknown, site: typeof settings.value) => ({
    title: site.name,
    alternates: { canonical: site.url },
  }),
}));
vi.mock("@/modules/billing/server/queries", () => ({
  hasManagedSubscription: async () => false,
}));
vi.mock("@/lib/auth/session", () => ({ getSession: async () => null }));
vi.mock("@/lib/content/blocks", () => ({ getContent: async () => ({}) }));
vi.mock("@/modules/billing/components/billing-action-button", () => ({
  BillingActionButton: () => null,
}));

import { generateMetadata } from "@/app/(marketing)/pricing/page";

describe("pricing metadata", () => {
  it("uses current CMS site settings", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toBe("Edited site");
    expect(metadata.alternates?.canonical).toBe("https://edited.test");
  });
});
