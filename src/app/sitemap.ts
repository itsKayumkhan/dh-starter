import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/content/settings";
import { ROUTES } from "@/lib/constants/routes";
import { installedModules } from "@/config/modules";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSiteSettings();
  const paths = new Set([
    ROUTES.home,
    ...installedModules.flatMap((module) => module.publicRoutes ?? []),
  ]);
  return [...paths].map((path) => ({
    url: new URL(path, site.url).toString(),
  }));
}
