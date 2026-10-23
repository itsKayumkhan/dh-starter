import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/content/settings";
import { ROUTES } from "@/lib/constants/routes";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSiteSettings();
  return [{ url: new URL(ROUTES.home, site.url).toString() }];
}
