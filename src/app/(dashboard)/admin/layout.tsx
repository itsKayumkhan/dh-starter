import { Suspense, type ReactNode } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requireRole } from "@/lib/auth/session";

async function AuthorizedAdmin({ children }: { children: ReactNode }) {
  await requireRole(["staff", "admin"]);
  return children;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}><AuthorizedAdmin>{children}</AuthorizedAdmin></Suspense>;
}
