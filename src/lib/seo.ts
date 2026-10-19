import type { Metadata } from "next";
import { createElement } from "react";
import { site } from "@/config/site";
import { ROUTES } from "@/lib/constants/routes";

export function buildMetadata(
  input: {
    title?: string;
    description?: string;
    path?: string;
    image?: string;
    noIndex?: boolean;
  } = {},
): Metadata {
  const url = new URL(input.path ?? ROUTES.home, site.url);
  return {
    title: input.title ? `${input.title} | ${site.name}` : site.name,
    description: input.description ?? site.description,
    metadataBase: new URL(site.url),
    alternates: { canonical: url },
    openGraph: {
      title: input.title ?? site.name,
      description: input.description ?? site.description,
      url,
      images: input.image ? [input.image] : undefined,
    },
    robots: input.noIndex ? { index: false, follow: false } : undefined,
  };
}
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: new URL(site.logo, site.url).toString(),
    email: site.supportEmail,
  };
}
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    description: site.description,
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
