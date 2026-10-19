import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { requirePermission } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors";
import { InquiryActions } from "@/modules/contact/components/inquiry-actions";
import { CONTACT_ROUTES } from "@/modules/contact/routes";
import { inquiryIdSchema } from "@/modules/contact/schemas/inquiry";
import { getInquiry } from "@/modules/contact/server/inquiries";

async function InquiryDetailPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("inquiries:read");
  const parsed = inquiryIdSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  let inquiry;
  try {
    inquiry = await getInquiry(parsed.data);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const replySubject = inquiry.subject
    ? `Re: ${inquiry.subject}`
    : `Re: Your inquiry to our team`;
  const replyHref = `mailto:${inquiry.email}?subject=${encodeURIComponent(replySubject)}`;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-7 px-4 py-8 sm:px-6">
      <Link href={CONTACT_ROUTES.inquiries} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-ring">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to inquiries
      </Link>
      <PageHeader
        title={inquiry.subject || "General inquiry"}
        description={`Received ${inquiry.createdAt.slice(0, 16).replace("T", " ")} UTC`}
        actions={<Button asChild><a href={replyHref}><Mail className="size-4" aria-hidden="true" /> Reply by email</a></Button>}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
        <Card>
          <CardHeader><CardTitle>Message</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap break-words text-sm leading-7">{inquiry.message}</p>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Sender</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-4 text-sm">
                <div><dt className="text-muted-foreground">Name</dt><dd className="break-words font-medium">{inquiry.name}</dd></div>
                <div><dt className="text-muted-foreground">Email</dt><dd className="break-all"><a href={`mailto:${inquiry.email}`} className="underline-offset-4 hover:underline">{inquiry.email}</a></dd></div>
                {inquiry.phone ? <div><dt className="text-muted-foreground">Phone</dt><dd><a href={`tel:${encodeURIComponent(inquiry.phone)}`} className="underline-offset-4 hover:underline">{inquiry.phone}</a></dd></div> : null}
                <div><dt className="text-muted-foreground">Source page</dt><dd className="break-all">{inquiry.source ?? "Unavailable"}</dd></div>
                <div><dt className="text-muted-foreground">Email status</dt><dd><Badge variant={inquiry.emailStatus === "failed" ? "destructive" : "outline"}>{inquiry.emailStatus}</Badge></dd></div>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Manage inquiry</CardTitle></CardHeader>
            <CardContent><InquiryActions id={inquiry.id} status={inquiry.status} emailStatus={inquiry.emailStatus} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Record details</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-4 text-sm">
                <div><dt className="text-muted-foreground">Reference</dt><dd className="break-all font-mono text-xs">{inquiry.id}</dd></div>
                <div><dt className="text-muted-foreground">IP address</dt><dd className="break-all">{inquiry.ip ?? "Unavailable"}</dd></div>
                <div><dt className="text-muted-foreground">Browser</dt><dd className="break-words">{inquiry.userAgent ?? "Unavailable"}</dd></div>
                <div><dt className="text-muted-foreground">Last updated</dt><dd>{inquiry.updatedAt.slice(0, 16).replace("T", " ")} UTC</dd></div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

export default function InquiryDetailPage(props: Parameters<typeof InquiryDetailPageContent>[0]) {
  return <Suspense fallback={<PageSkeleton title="Inquiry details" variant="cards" />}><InquiryDetailPageContent {...props} /></Suspense>;
}
