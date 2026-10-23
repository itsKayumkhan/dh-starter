import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSiteSettings } from "@/lib/content/settings";
import { ROUTES } from "@/lib/constants/routes";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const site = await getSiteSettings();
  return (
    <main className="bg-muted/30 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md space-y-5">
        <Link
          href={ROUTES.home}
          className="focus-visible:ring-ring flex items-center justify-center gap-2 rounded-md text-lg font-semibold outline-none focus-visible:ring-2"
        >
          <Image src={site.logo} alt="" width={32} height={32} unoptimized />
          <span>{site.name}</span>
        </Link>
        <Card className="shadow-sm">
          <CardHeader className="sr-only">Account access</CardHeader>
          <CardContent className="p-6 sm:p-8">{children}</CardContent>
        </Card>
        <Link
          href={ROUTES.home}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring mx-auto flex w-fit items-center gap-2 rounded-md text-sm underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          <ArrowLeft className="size-4" /> Back to home
        </Link>
      </div>
    </main>
  );
}
