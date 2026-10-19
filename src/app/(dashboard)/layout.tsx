import { Suspense, type ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardShellSkeleton } from "@/components/layout/dashboard-shell-skeleton";
import { requireUser } from "@/lib/auth/session";

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return <DashboardShell user={{ id: user.id, name: user.name, email: user.email, image: user.image ?? null, role: user.role ?? "" }}>
    {children}
  </DashboardShell>;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<DashboardShellSkeleton />}><AuthenticatedShell>{children}</AuthenticatedShell></Suspense>;
}
