import Link from "next/link";
import type { ReactNode } from "react";
import { getSiteSettings } from "@/lib/content/settings";
import { ROUTES } from "@/lib/constants/routes";
import { MESSAGES } from "@/lib/constants/messages";

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const site = await getSiteSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <nav className="mx-auto flex max-w-5xl items-center justify-between p-5">
          <Link className="font-semibold" href={ROUTES.home}>
            {site.name}
          </Link>
          <div className="flex gap-5 text-sm">
            <Link href={ROUTES.login}>{MESSAGES.signIn}</Link>
            <Link href={ROUTES.signup}>{MESSAGES.getStarted}</Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="text-muted-foreground border-t p-6 text-center text-sm">
        {site.name}
      </footer>
    </div>
  );
}
