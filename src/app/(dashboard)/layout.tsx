import { Suspense, type ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardShellSkeleton } from "@/components/layout/dashboard-shell-skeleton";
import { DashboardProviders } from "@/components/shared/dashboard-providers";
import { requireUser } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/content/settings";

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const site = await getSiteSettings();
  return (
    <DashboardProviders>
      <DashboardShell
        site={site}
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image ?? null,
          role: user.role ?? "",
        }}
      >
        {children}
      </DashboardShell>
    </DashboardProviders>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
