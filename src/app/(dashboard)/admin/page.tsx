import Link from "next/link";
import { Ban, CircleHelp, Clock3, UsersRound } from "lucide-react";
import { installedModules } from "@/config/modules";
import { getAdminOverview } from "@/app/(dashboard)/admin/_data/overview";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export default async function AdminPage() {
  const user = await requireRole(["staff", "admin"]);
  const counts = await getAdminOverview();
  const links = installedModules.flatMap((module) => module.nav)
    .filter((item) => item.section === "admin" && (!item.permission || can(user, item.permission)));
  return <section className="space-y-6">
    <PageHeader title="Admin overview" description="User status and management shortcuts." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total users" value={counts.total} icon={UsersRound} />
      <StatCard title="New in 7 days" value={counts.newLastSevenDays} icon={Clock3} />
      <StatCard title="Banned" value={counts.banned} icon={Ban} />
      <StatCard title="Unverified" value={counts.unverified} icon={CircleHelp} />
    </div>
    <Card>
      <CardHeader><CardTitle>Quick links</CardTitle></CardHeader>
      <CardContent>
        {links.length ? <div className="flex flex-wrap gap-2">{links.map((item) => <Button key={item.href} variant="outline" asChild><Link href={item.href}><item.icon aria-hidden="true" />{item.title}</Link></Button>)}</div>
          : <EmptyState title="No admin modules installed" description="Installed admin modules will appear here." />}
      </CardContent>
    </Card>
  </section>;
}
