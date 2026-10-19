import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return <DashboardShell user={{ id: user.id, name: user.name, email: user.email, image: user.image ?? null, role: user.role ?? "" }}>
    {children}
  </DashboardShell>;
}
