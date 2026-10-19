import { Activity, CircleCheck, Clock3, FolderKanban, Inbox } from "lucide-react";
import { DemoActivityChart } from "@/components/layout/demo-activity-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name.trim().split(/\s+/)[0] || "there";
  return <section className="space-y-6">
    <PageHeader title={`Welcome back, ${firstName}`} description="Here is your workspace overview." />
    {/* Demo values are placeholders until a project connects real metrics. */}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Projects" value="12" delta="Demo data" icon={FolderKanban} />
      <StatCard title="Completed tasks" value="84" delta="Demo data" icon={CircleCheck} />
      <StatCard title="Hours saved" value="36" delta="Demo data" icon={Clock3} />
      <StatCard title="Activity" value="1,248" delta="Demo data" icon={Activity} />
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Activity trend</CardTitle><CardDescription>Demo data for layout preview</CardDescription></CardHeader>
        <CardContent><DemoActivityChart /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Recent activity</CardTitle><CardDescription>Your latest workspace updates</CardDescription></CardHeader>
        <CardContent><EmptyState icon={Inbox} title="No recent activity" description="Your latest updates will appear here." /></CardContent>
      </Card>
    </div>
  </section>;
}
