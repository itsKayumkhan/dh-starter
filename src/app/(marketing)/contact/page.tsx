import type { Metadata } from "next";
import { Mail, MapPin } from "lucide-react";
import { site } from "@/config/site";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo";
import { ContactFormWithToken } from "@/modules/contact/components/contact-form-with-token";
import { CONTACT_ROUTES } from "@/modules/contact/routes";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: `Contact ${site.name}. We would be glad to hear from you.`,
  path: CONTACT_ROUTES.contact,
});

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-20">
      <div className="mb-10 max-w-2xl space-y-3">
        <p className="text-sm font-medium text-primary">{site.name}</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Contact us</h1>
        <p className="text-lg text-muted-foreground">
          Have a question or a project in mind? Send a message and we will get back to you.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
        <Card>
          <CardHeader><CardTitle>Send an inquiry</CardTitle></CardHeader>
          <CardContent><ContactFormWithToken /></CardContent>
        </Card>
        <aside className="space-y-6 rounded-xl border border-border bg-muted/30 p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Business details</h2>
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <a className="break-all underline-offset-4 hover:underline focus-visible:outline-ring" href={`mailto:${site.supportEmail}`}>
              {site.supportEmail}
            </a>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-muted-foreground">{site.address}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
