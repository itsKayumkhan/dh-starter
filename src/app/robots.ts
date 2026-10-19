import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { ROUTES } from "@/lib/constants/routes";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ROUTES.home,
      disallow: [ROUTES.dashboard, ROUTES.admin, ROUTES.api],
    },
    sitemap: new URL(ROUTES.sitemap, site.url).toString(),
  };
}
