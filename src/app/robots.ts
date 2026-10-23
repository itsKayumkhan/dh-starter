import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/content/settings";
import { ROUTES } from "@/lib/constants/routes";
export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSiteSettings();
  return {
    rules: {
      userAgent: "*",
      allow: ROUTES.home,
      disallow: [ROUTES.dashboard, ROUTES.admin, ROUTES.api],
    },
    sitemap: new URL(ROUTES.sitemap, site.url).toString(),
  };
}
