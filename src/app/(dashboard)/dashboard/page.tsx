import { Suspense } from "react";
import { Inbox } from "lucide-react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/session";

async function DashboardPageContent() {
  const user = await requireUser();
  const firstName = user.name.trim().split(/\s+/)[0] || "there";
  return (
    <section className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here is your workspace overview."
      />
      <EmptyState
        icon={Inbox}
        title="No recent activity"
        description="Your latest updates will appear here."
      />
    </section>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton title="Dashboard" variant="cards" />}>
      <DashboardPageContent />
    </Suspense>
  );
}
