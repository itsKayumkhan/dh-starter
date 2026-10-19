import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { site } from "@/config/site";
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser();
  return (
    <div className="min-h-screen">
      <header className="border-b p-5">
        <Link href={ROUTES.dashboard} className="font-semibold">
          {site.name}
        </Link>
      </header>
      {children}
    </div>
  );
}
