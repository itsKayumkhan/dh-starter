import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { ROUTES } from "@/lib/constants/routes";
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: new URL(ROUTES.home, site.url).toString() }];
}
