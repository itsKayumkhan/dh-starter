import type { Metadata } from "next";
import { createElement } from "react";
import { site } from "@/config/site";
import type { SiteSettings } from "@/config/settings";
import { ROUTES } from "@/lib/constants/routes";

export function buildMetadata(
  input: {
    title?: string;
    description?: string;
    path?: string;
    image?: string;
    noIndex?: boolean;
  } = {},
  settings: SiteSettings = site,
): Metadata {
  const url = new URL(input.path ?? ROUTES.home, settings.url);
  const title = input.title ? settings.seo.titleTemplate.replace("%s", input.title) : settings.name;
  return {
    title,
    description: input.description ?? settings.seo.description,
    metadataBase: new URL(settings.url),
    alternates: { canonical: url },
    openGraph: {
      title: input.title ?? settings.name,
      description: input.description ?? settings.seo.description,
      url,
      images: input.image ? [input.image] : undefined,
    },
    robots: input.noIndex ? { index: false, follow: false } : undefined,
  };
}
export function organizationJsonLd(settings: SiteSettings = site) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.name,
    url: settings.url,
    logo: new URL(settings.logo, settings.url).toString(),
    email: settings.supportEmail,
  };
}
export function websiteJsonLd(settings: SiteSettings = site) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.name,
    url: settings.url,
    description: settings.description,
  };
}
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return createElement("script", {
    type: "application/ld+json",
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    },
  });
}
