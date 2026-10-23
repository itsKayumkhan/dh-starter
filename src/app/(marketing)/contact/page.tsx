import type { Metadata } from "next";
import { Suspense } from "react";
import { Mail, MapPin } from "lucide-react";
import { getSiteSettings } from "@/lib/content/settings";
import { getContent } from "@/lib/content/blocks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { buildMetadata } from "@/lib/seo";
import { ContactFormWithToken } from "@/modules/contact/components/contact-form-with-token";
import { CONTACT_ROUTES } from "@/modules/contact/routes";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata(
    {
      title: "Contact",
      description: `Contact ${settings.name}. We would be glad to hear from you.`,
      path: CONTACT_ROUTES.contact,
    },
    settings,
  );
}

export default async function ContactPage() {
  const [settings, intro] = await Promise.all([
    getSiteSettings(),
    getContent("contact.intro"),
  ]);
  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-20">
      <div className="mb-10 max-w-2xl space-y-3">
        <p className="text-primary text-sm font-medium">{settings.name}</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {intro.title}
        </h1>
        <p className="text-muted-foreground text-lg">{intro.subtitle}</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{intro.formTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="space-y-4" aria-busy="true">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-36 w-full" />
                  <Skeleton className="h-10 w-32" />
                </div>
              }
            >
              <ContactFormWithToken />
            </Suspense>
          </CardContent>
        </Card>
        <aside className="border-border bg-muted/30 space-y-6 rounded-xl border p-6 sm:p-8">
          <h2 className="text-xl font-semibold">{intro.detailsTitle}</h2>
          <div className="flex items-start gap-3">
            <Mail
              className="text-primary mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <a
              className="focus-visible:outline-ring break-all underline-offset-4 hover:underline"
              href={`mailto:${settings.supportEmail}`}
            >
              {settings.supportEmail}
            </a>
          </div>
          <div className="flex items-start gap-3">
            <MapPin
              className="text-primary mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <p className="text-muted-foreground">{settings.address}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
